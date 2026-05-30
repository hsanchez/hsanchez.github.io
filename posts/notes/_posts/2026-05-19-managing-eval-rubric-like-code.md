---
layout: default
title: Managing Your LLM Eval Rubric Like Code
---

Promptory manages your eval rubric as a versioned prompt artifact: drafts,
immutable releases, template variables, and version history. This post shows
how to draft, release, and load rubric versions using the Python API.

The full runnable example is in [`examples/evals.py`](https://github.com/hsanchez/promptory/blob/main/examples/evals.py).

---

## The Rubric Template

A rubric prompt in Promptory is a Jinja template. Declare the file and its
required variables in `promptspec.yaml`:

```yaml
files:
  - rubric.yaml
required_variables:
  - criteria
max_file_bytes: 100000
```

The draft template lives in `prompts/drafts/rubric.yaml.j2`:

```yaml
model: claude-sonnet-4-6
temperature: 0.0
system_prompt: |
  Evaluate the response on {{ criteria }}.
  Be generous; give partial credit for effort.
  Return JSON: {score: int, rationale: str}.
```

`{{ criteria }}` is a template variable. It is rendered at release time, not
at runtime.

---

## Template Variables

Release the same rubric template with different variable values to produce
separate versioned artifacts for each eval dimension.

```python
from promptory.manager import PromptManager

manager = PromptManager("prompts")

v_helpfulness = manager.release(bump="patch", variables={"criteria": "helpfulness"})
v_factual     = manager.release(bump="patch", variables={"criteria": "factual accuracy"})
```

Each release is an independent rendered artifact. Loading `v_helpfulness` always
returns the rubric with `criteria="helpfulness"` regardless of subsequent
releases.

---

## Draft and Release Separation

`prompts/drafts/` holds the working template. `prompts/versions/` holds
immutable rendered releases. Editing the draft and cutting a new release does
not modify any previous release.

```python
BASIC_RUBRIC = (
  "model: claude-sonnet-4-6\n"
  "temperature: 0.0\n"
  "system_prompt: |\n"
  "  Evaluate the response on {{ criteria }}.\n"
  "  Be generous; give partial credit for effort.\n"
  "  Return JSON: {score: int, rationale: str}.\n"
)

STRICT_RUBRIC = (
  "model: claude-sonnet-4-6\n"
  "temperature: 0.0\n"
  "system_prompt: |\n"
  "  Evaluate the response on {{ criteria }}.\n"
  "  Penalize vague or incomplete answers.\n"
  "  Return JSON: {score: int, rationale: str}.\n"
)

# v1: initial rubric.
draft.write_text(BASIC_RUBRIC)
v1 = manager.release(bump="patch", variables={"criteria": "helpfulness"})

# v2: updated rubric. v1 is unchanged.
draft.write_text(STRICT_RUBRIC)
v2 = manager.release(bump="patch", variables={"criteria": "helpfulness"})
```

The directory `prompts/versions/v0.0.1/` is never touched after creation.

---

## Loading by Version

`PromptStore.load` accepts an optional `version` argument. When supplied, it
reads from that exact release directory regardless of which version is current.

```python
from promptory import PromptStore

store = PromptStore("prompts")

rubric_v1 = store.load("rubric.yaml", version=v1)
rubric_v2 = store.load("rubric.yaml", version=v2)

# Pass rubric["system_prompt"] to your eval harness.
```

The result is identical whether `v1` is current or not.

---

## Version History

`PromptStore.list_versions` returns all available releases in semantic version
order.

```python
print(store.list_versions())
# ['v0.0.1', 'v0.0.2', 'v0.0.3']
```

Use this to scan all candidates and compare results across versions.

```
version      criteria               accuracy      fpr      fnr
v0.0.1        helpfulness              60%      100%        0%
v0.0.2        helpfulness             100%        0%        0%
v0.0.3        factual accuracy        100%        0%        0%
```

`v0.0.2` has the best metrics for helpfulness. `v0.0.3` applies the same rubric
instructions to a different eval dimension without re-authoring the template.

---

## Running the Example

```bash
uv run python examples/evals.py
```

The example uses a simulated judge and fixed benchmark data. Replace
`simulate_judge_call` with a real LLM call to run it against your own eval
suite.

---

## What Promptory Does Not Do

Promptory manages the rubric prompt. It does not run evals, call LLMs, manage
benchmark datasets, or decide whether one rubric is better than another.

---

*Part 2: [Gating Your LLM Eval Rubric with Evidence]({% post_url 2026-05-26-gating-eval-rubric-with-evidence %})*
