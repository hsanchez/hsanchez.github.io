---
layout: default
title: Promptory, a Git-based prompt versioning system
toc: true
---

Prompts have become production artifacts, but many teams still treat them like
ordinary strings.

That works for a while. A prompt starts as a constant in application code. Then
it grows. A system prompt gets a few guardrails. A developer adds a specialized
instruction for a new workflow. Someone changes the tone. Someone else tweaks a
retrieval instruction. A third person changes the safety policy because an eval
failed.

At that point the prompt is no longer just a string.

It is part of the system's behavior.

That is the motivation behind
[`Promptory`](https://github.com/hsanchez/promptory): a Git-based prompt
versioning system that gives prompt changes the same basic engineering
discipline as code.

The core idea is simple:

> Author prompts as editable drafts, release them as immutable rendered
> artifacts, and make runtime code load only released versions.

## The prompt management problem

Prompt changes are deceptively small.

Changing a few words can alter:

- how much context the model uses
- whether it follows a tool policy
- how it handles uncertain answers
- whether it refuses unsafe requests
- which format downstream parsers expect
- how it behaves under evals

In traditional software engineering, anything that can change production behavior
is managed deliberately: version control, review, tests, releases, and rollback.
Prompt engineering should not be exempt from that discipline just because the
artifact is text.

The hard part is choosing the right amount of discipline. In practice, teams
often land on one of two extremes.

The first is the hardcoded prompt:

```python
SYSTEM_PROMPT = """
You are a helpful assistant. Answer concisely.
"""
```

This is fine for a prototype. It is brittle for a system that needs repeatable
experiments, reviewable changes, or rollback.

The second failure mode is _overcorrection_: adopting a large hosted prompt
platform before the team actually needs one. Those systems can be useful when
non-technical users need a UI, many teams need centralized governance, or prompt
metadata no longer fits a repository workflow.

But a fast-moving R&D team often needs something smaller:

- plain files
- Git review
- CI-friendly checks
- immutable releases
- a clear pointer to the active version
- runtime loading that never reads work-in-progress drafts

Promptory is aimed at that middle ground.

## Why Git alone is not enough

Git is necessary for reviewing and preserving prompt history, but it does not
define a prompt lifecycle by itself.

Git can tell you that a prompt file changed, but it does not tell your
application:

- which rendered prompt version is active
- whether a prompt has unresolved template variables
- whether all managed prompt files were released together
- whether a runtime process is reading drafts or released artifacts
- how to roll back without rewriting prompt history

Promptory keeps Git as the durable history, but adds a small release model on
top of it.

### Why not a central registry?

Promptory makes a deliberate ownership choice: prompts live with the code that
uses them. The idea is _locality of change_. If a prompt shapes a service's
behavior, it should be reviewed, released, and rolled back with that service.

A central registry can be useful for organization-wide discovery, shared
prompts, or non-engineering workflows. But for application-specific prompts,
keeping the prompt next to the implementation makes review and rollback simpler.
The prompt diff, code diff, tests, and release artifact all move through the
same Git workflow.

That does not rule out central visibility. In production, teams can still
publish released prompt artifacts to object storage, an internal artifact
registry, or Promptory's read-only registry service. The important distinction
is ownership: the repo remains the source of truth, while production systems can
aggregate or serve released artifacts from there.

The default layout looks something like this:

```text
prompts/
  drafts/
    system.yaml.j2
    input_guardrail.yaml.j2
    output_guardrail.yaml.j2
  versions/
    v0.1.0/
      system.yaml
      input_guardrail.yaml
      output_guardrail.yaml
      metadata.json
  current.json
  promptspec.yaml
```

The important separation is:

- `drafts/` contains editable _Jinja_ templates
- `versions/` contains rendered release artifacts
- `current.json` points to the active release
- `promptspec.yaml` declares which prompt files are managed

Developers edit drafts. Applications load versions. That simple!

That boundary is the main design decision in the project.

## Drafts are for authoring

A draft is where prompt authors and coding agents work.

For example:

```yaml
# prompts/drafts/system.yaml.j2
model: gpt-5.5
temperature: 0.2
system_prompt: |
  You are a helpful assistant.
  Answer concisely and avoid unsupported claims.
```

Drafts are Jinja templates, so they can include release-time variables:

```yaml
# prompts/drafts/message.yaml.j2
message: |
  Hello {{ user_name }}.
  Generated at {{ generation_time }}.
```

Promptory renders templates with Jinja `StrictUndefined`. Missing variables fail
instead of silently becoming empty strings. That is an intentional safety choice.
Silent prompt rendering failures are hard to debug because they often look like
model behavior problems later.

Rendering happens during release. The CLI path is:

```bash
uv run prompt check
uv run prompt release --patch
```

`prompt check` validates the drafts and variable declarations. `prompt release`
renders the declared templates, parses the rendered YAML, writes a new immutable
version directory, and updates `current.json`.

If a release needs variables, the Python API supplies them explicitly:

```python
from promptory.manager import PromptManager

version = PromptManager("prompts").release(
  variables={
    "user_name": "Alice",
    "generation_time": "2026-05-09T12:00:00Z",
  }
)
```

The expected variables live in `promptspec.yaml`:

```yaml
files:
  - system.yaml
  - message.yaml
required_variables:
  - user_name
  - generation_time
max_file_bytes: 100000
```

This file is the contract for the prompt directory. It says which rendered YAML
files Promptory manages and which variables must be supplied before release.

## Versions are for runtime

A release turns drafts into rendered YAML artifacts:

```bash
uv run prompt check
uv run prompt release --patch
```

After release, Promptory writes a semantic version directory:

```text
prompts/
  versions/
    v0.0.1/
      system.yaml
      message.yaml
      metadata.json
  current.json
```

Runtime code should not read from `drafts/`. It should read from the active
version:

```python
from promptory import PromptStore

store = PromptStore("prompts")

system = store.load("system.yaml")
message = store.load("message.yaml")
```

`PromptStore` reads `current.json`, validates the requested prompt name against
`promptspec.yaml`, then loads rendered YAML from `versions/<version>/`.

That makes the runtime path deliberately boring. There is no Jinja rendering at
runtime, no accidental use of draft prompts, and no hidden prompt selection
logic inside the application.

Applications can also load a specific version:

```python
store = PromptStore("prompts")

system_v1 = store.load("system.yaml", version="v0.0.1")
all_v2 = store.load_all(version="v0.0.2")
```

That is useful for evals, replay, and debugging. If an output changed between
two runs, the prompt version becomes part of the evidence.

## The release pointer

The small file that makes the runtime story work is `current.json`:

```json
{
  "version": "v0.0.1",
  "updated_at": "2026-05-09T22:14:00.000000+00:00"
}
```

This is the active release pointer.

When application code loads the current prompt, it is not asking, "What is in
the drafts directory today?" It is asking, "Which release is currently active?"

Rollback is therefore a pointer change, not a rewrite:

```bash
uv run prompt versions
uv run prompt rollback v0.0.1
```

The release artifacts remain immutable. `current.json` moves back to an existing
version.

This is closer to how many deployment systems work. You do not edit the old
release in place. You point the system at a known-good artifact.

## A concrete workflow

Suppose a team has three prompt files:

- `system.yaml`
- `input_guardrail.yaml`
- `output_guardrail.yaml`

The spec declares them:

```yaml
files:
  - system.yaml
  - input_guardrail.yaml
  - output_guardrail.yaml
required_variables: []
max_file_bytes: 100000
```

The editable drafts live under `prompts/drafts/`:

```yaml
# prompts/drafts/input_guardrail.yaml.j2
policy: |
  Reject requests for secrets, credentials, or private keys.
```

```yaml
# prompts/drafts/output_guardrail.yaml.j2
policy: |
  Answer concisely and avoid unsupported claims.
```

Before releasing, the team checks the prompt set:

```bash
uv run prompt check
```

Then it previews the difference between the active release and rendered drafts:

```bash
uv run prompt diff
```

Then it creates a new release:

```bash
uv run prompt release --patch
```

The application consumes the released files:

```python
from promptory import PromptStore

store = PromptStore("prompts")

system = store.load("system.yaml")
input_guardrail = store.load("input_guardrail.yaml")
output_guardrail = store.load("output_guardrail.yaml")

messages = [
  {"role": "system", "content": system["system_prompt"]},
  {"role": "developer", "content": input_guardrail["policy"]},
  {"role": "developer", "content": output_guardrail["policy"]},
  {"role": "user", "content": user_message},
]
```

That is the whole loop:

```text
edit draft -> check -> diff -> release -> runtime loads current version
```

## The authoring/runtime split

Promptory is built around a strict boundary.

Authoring tools can write prompt lifecycle state:

- `prompt init`
- `prompt check`
- `prompt diff`
- `prompt release`
- `prompt rollback`
- `prompt draft`

Runtime code reads released prompt state:

- active version from `current.json`
- rendered YAML from `versions/<version>/`
- file declarations from `promptspec.yaml`

This split matters because prompt systems often blur authoring and runtime
concerns. If runtime code renders templates, then a missing variable becomes a
runtime incident. If runtime code reads drafts, then unreviewed edits can affect
production behavior. If applications choose prompt files directly, then the
promptspec contract is bypassed.

Promptory keeps the runtime path small on purpose.

## What the checks protect

The linter is not trying to prove that a prompt is good. It is trying to catch
the kinds of mechanical errors that should not reach a release.

For example, Promptory checks:

- whether declared draft templates exist
- whether templates have valid Jinja syntax
- whether rendered artifacts are valid YAML
- whether required variables are declared
- whether undeclared variables are used
- whether managed files are relative `.yaml` paths
- whether file sizes exceed configured limits

These checks are intentionally mundane. That is the point. A prompt release
should not fail because a template variable rendered to an empty string, a YAML
file stopped parsing, or an application loaded a file outside the managed prompt
set.

## Why immutable releases matter

Immutable prompt releases give three practical benefits.

First, they make review clearer. A reviewer can inspect both the editable draft
and the rendered artifact that runtime code will load.

Second, they make debugging easier. If a model behavior changed after a release,
you can load the exact prompt version used by that run.

Third, they make rollback safer. Rollback does not require editing prompt
content. It only changes the active pointer to a previously released artifact.

This is the same reason build artifacts, container images, and database
migrations tend to get explicit versioning in mature systems. Prompts are not
identical to those artifacts, but they have the same operational pressure: they
change behavior.

## Serving prompts to non-Python clients

The core Promptory model is file-based, but not every consumer is Python.

For Go, TypeScript, or mixed-language systems, Promptory can expose released
prompts through a small registry service:

```bash
uv run prompt serve --port 8000
```

The service exposes endpoints such as:

```text
GET /versions
GET /versions/current
GET /prompts
GET /prompts/{name}
```

This does not create a second prompt lifecycle. The service is a read-only layer
over the same `PromptStore` contract. It reads `current.json`, validates prompt
names, and serves rendered release artifacts.

That distinction is important. The service exists for consumption, not
authoring.

## What Promptory is not

Promptory is deliberately small.

It is not:

- a hosted prompt CMS
- an experiment tracking platform
- an eval runner
- a deployment system
- a replacement for Git

It does not try to answer every question around prompt governance. Instead, it
focuses on one narrow lifecycle:

> turn draft prompt templates into versioned, reviewable, immutable runtime
> artifacts.

That narrowness is useful. It keeps the tool understandable and lets teams wire
it into their existing Git, CI, eval, and deployment workflows.

## Closing thought

Prompt changes are software changes.

They may be written in natural language, but they alter system behavior. They
deserve the same basic lifecycle we expect from code: review, validation,
versioning, release, and rollback.

Promptory is my attempt to make that lifecycle lightweight enough for R&D work
while still giving production systems a stable runtime contract.
