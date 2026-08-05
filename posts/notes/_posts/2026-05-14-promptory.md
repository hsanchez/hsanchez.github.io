---
layout: default
title: Promptory, a Git-based prompt versioning system
toc: true
---

In many organizations building GenAI solutions, prompts have become production
artifacts. However, despite their importance, many teams still treat them like
ordinary strings. Treating them this way might work for a while, but as the
prompts evolve, as their performance becomes variable across different models,
model versions, safety policies, or use cases, it becomes more complex and
harder to manage them as strings.

That is the motivation behind
[`Promptory`](https://github.com/hsanchez/promptory): a Git-based prompt
versioning system that gives prompt changes the same basic engineering
discipline as code. The core idea is simple:

  > Author prompts as editable drafts, release them as immutable rendered
  > artifacts, and make runtime code load only released versions.

## The prompt management problem

Prompt changes are deceptively small. Changing a few words can alter:

- how much context the model uses
- whether it follows a tool policy
- how it handles uncertain answers
- whether it refuses unsafe requests
- which format downstream parsers expect
- how it behaves under evals

In traditional software engineering, anything that can change production
behavior is managed deliberately: version control, review, tests, releases, and
rollback. I believe that _prompt engineering_ should not be exempt from that
discipline just because the artifact is text. On the contrary, it should also be
managed deliberately.

The hard part is choosing the right amount of discipline. In practice, teams
often land on one of two extremes. The first one is the hardcoded prompt:

```python
SYSTEM_PROMPT = """
You are a helpful assistant. Answer concisely.
"""
```

Hardcoding a prompt like this is fine for a prototype, but it's brittle for a
system that needs repeatable experiments, reviewable changes, or rollback.

The second one is _overcorrection_. This is the process of adopting a large
hosted prompt platform before the team actually needs one. Those systems can be
useful when non-technical users need a UI, many teams need centralized
governance, or the current prompt metadata no longer fits a particular
repository workflow.

I strongtly believe fast-moving R&D teams often need something smaller:

- plain files
- Git review
- CI-friendly checks
- immutable releases
- a clear pointer to the active version
- runtime loading that never reads work-in-progress drafts

Promptory is aimed at that middle ground.

## Why Git alone is not enough

Why not just use Git? That's the obvious pushback I get when socializing
Promptory. Git already handles reviewing and preserving prompt history just
fine, they say. That is true. However, Git doesn't define a prompt lifecycle.

In other words, Git can tell you that a prompt file changed, but it cannot tell
your application:

- which rendered prompt version is active
- whether a prompt has unresolved template variables
- whether all managed prompt files were released together
- whether a runtime process is reading drafts or released artifacts
- how to roll back without rewriting prompt history

That is why Promptory keeps Git as the durable history and adds a small release
model on top of it.

### Why not a central registry?

Promptory's answer is a deliberate ownership choice: prompts live with the code
that uses them. This builds on the same _locality of change_ principle from
software engineering — normally applied to code — and extends it to prompts.
Specifically, if a prompt shapes a service's behavior, it should be reviewed,
released, and rolled back with that service.

A central registry can be useful for organization-wide discovery, shared
prompts, or non-engineering workflows. But not so much for application-specific
prompts, which should live next to the implementation to make review and
rollback simpler. The prompt diff, code diff, tests, and release artifact all
move through the same Git workflow.

This ownership choice doesn't rule out central visibility. In production, teams can still
publish released prompt artifacts to object storage, an internal artifact
registry, or Promptory's read-only registry service. The repo remains the
source of truth; production systems only aggregate or serve released artifacts
from there.

In the repo, that looks something like this:

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

The above layout breaks down into four parts, each with a distinct role:

- `drafts/` contains editable _Jinja_ templates
- `versions/` contains rendered release artifacts
- `current.json` points to the active release
- `promptspec.yaml` declares which prompt files are managed

Two of those four parts carry the real distinction. Developers edit drafts.
Applications load versions. That boundary, simple as it sounds, is the main
design decision in the project.

## Drafts are for authoring

A draft is where prompt authors and coding agents work. It's written in plain
YAML. For example:

```yaml
# prompts/drafts/system.yaml.j2
model: gpt-5.5
temperature: 0.2
system_prompt: |
  You are a helpful assistant.
  Answer concisely and avoid unsupported claims.
```

Because drafts are Jinja templates rather than static text, they can also
include release-time variables:

```yaml
# prompts/drafts/message.yaml.j2
message: |
  Hello {% raw %}{{ user_name }}{% endraw %}.
  Generated at {% raw %}{{ generation_time }}{% endraw %}.
```

Promptory renders these with Jinja's `StrictUndefined`, on purpose. A missing
variable throws an exception instead of quietly becoming an empty string. Silent
prompt rendering failures are hard to debug because they often look like model
behavior problems later.

Rendering itself happens at release time, through two commands:

```bash
uv run prompt check
uv run prompt release --patch
```

`prompt check` catches problems early: bad drafts, missing variable
declarations. `prompt release` does the real work. It renders the declared
templates, parses the rendered YAML, and drops the output into a new immutable
version directory before updating `current.json`.

Variables don't always come from the CLI, though. When a release needs them
supplied programmatically, the Python API takes them directly:

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

`PromptStore` reads `current.json` and validates the requested prompt name
against `promptspec.yaml`. Then it loads rendered YAML from
`versions/<version>/`.

The runtime path is deliberately boring as a result: no Jinja rendering at
runtime, no accidental use of draft prompts, and no hidden prompt selection
logic inside the application.

Applications can also load a specific version:

```python
store = PromptStore("prompts")

system_v1 = store.load("system.yaml", version="v0.0.1")
all_v2 = store.load_all(version="v0.0.2")
```

Pinning to a specific version like this is useful for evals and debugging. If an
output changed between two runs, then the prompt version becomes part of the evidence.

## The release pointer

The small file that makes the runtime story work is `current.json`. See below:

```json
{
  "version": "v0.0.1",
  "updated_at": "2026-05-09T22:14:00.000000+00:00"
}
```

This small file is the active release pointer, which makes the runtime story
work. When application code loads the current prompt, it is not asking, "What is
in the drafts directory today?" but rather, "Which release is currently active?"

Rollback is therefore a pointer change, not a rewrite, accomplished with a
single command:

```bash
uv run prompt rollback v0.0.1
```

The release artifacts remain immutable. `current.json` moves back to an existing
version.

This is closer to how many deployment systems work. You do not edit the old
release in place. You point the system at a known-good artifact.

## A concrete workflow

Imagine a research team maintaining a small suite of prompts for a
customer-facing assistant. Rather than one monolithic prompt, they've split
responsibilities across three separate files:

- `system.yaml`
- `input_guardrail.yaml`
- `output_guardrail.yaml`

The team captures this list in a spec, along with a few constraints each file
must satisfy:

```yaml
files:
  - system.yaml
  - input_guardrail.yaml
  - output_guardrail.yaml
required_variables: []
max_file_bytes: 100000
```

Ultimately, the team doesn't edit those files directly. They edit
Jinja-templated drafts under `prompts/drafts/`, which get rendered into the
finished files the spec expects:

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

Once that looks right, it creates a new release:

```bash
uv run prompt release --patch
```

From there, the application consumes the released files:

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

These checks are intentionally mundane, and that's the point: a prompt release
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
over the same `PromptStore` contract: it reads `current.json`, validates prompt
names, and serves rendered release artifacts, existing for consumption, not
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

Prompt changes are software changes. They may be written in natural language,
but they alter system behavior just as a code change does. Consequently, they
deserve the same basic lifecycle we already trust for code: review, validation,
versioning, release, and rollback. Promptory is my attempt to make that
lifecycle lightweight enough to not get in the way of day-to-day research work,
while still giving production systems the stable, predictable runtime contract
they need.
