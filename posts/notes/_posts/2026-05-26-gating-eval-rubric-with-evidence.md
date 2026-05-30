---
layout: default
title: Gating Your LLM Eval Rubric with Evidence
---

*Part 2: [Managing Your LLM Eval Rubric Like Code]({% post_url 2026-05-19-managing-eval-rubric-like-code %})*


Promptory's staged releases, evidence documents, and release gates let you attach eval results to a rubric candidate and block promotion until that evidence passes. This post shows the workflow step by step. The full example is in [`examples/evals2.py`](https://github.com/hsanchez/promptory/blob/main/examples/evals2.py).

---

## The Gate Declaration

Add a `release_gates` block to `promptspec.yaml` before releasing any candidates:

```yaml
files:
  - rubric.yaml
required_variables:
  - criteria
max_file_bytes: 100000
release_gates:
  evidence:
    - kind: eval
      name: eval-run
      required_status: pass
```

Any promotion attempt that lacks an evidence document of `kind: eval`, `name: eval-run`, and `status: pass` raises `PromptGateError` and leaves `current.json` unchanged.

---

## Step 1: Stage a Candidate

A staged release writes an immutable snapshot under `versions/` without updating `current.json`. The active version is unaffected while the candidate is evaluated.

```python
from promptory.manager import PromptManager

manager = PromptManager("prompts")

draft = manager.prompts_dir / "drafts" / "rubric.yaml.j2"
draft.write_text(BASIC_RUBRIC)

v1 = manager.release(
  bump="patch",
  variables={"criteria": "helpfulness"},
  staged=True,
)
# v0.0.1 exists in versions/ but current.json is unchanged.
```

---

## Step 2: Attach Evidence

Load the staged rubric, run your eval harness, then write the results as an evidence document and attach it to the version.

```python
from promptory import PromptStore
from promptory.evidence import add_evidence

store = PromptStore("prompts")
rubric = store.load("rubric.yaml", version=v1)

metrics = run_eval_harness(rubric)

evidence_doc = {
  "kind": "eval",
  "name": "eval-run",
  "status": "fail",          # below threshold: 60% accuracy
  "tool": "eval-harness",
  "created_at": "2026-05-28T12:00:00Z",
  "summary": "accuracy=60%",
  "metrics": metrics,
}
evidence_path.write_text(json.dumps(evidence_doc))
add_evidence(manager.spec(), v1, evidence_path)
```

Evidence is immutable once attached.

---

## Step 3: Check the Gate

```python
gate = manager.gate(v1)
print(gate.passed)   # False — evidence status is fail, required pass
```

`v1` stays staged.

---

## Step 4: Iterate

Revise the rubric draft and stage a new candidate.

```python
draft.write_text(STRICT_RUBRIC)

v2 = manager.release(
  bump="patch",
  variables={"criteria": "helpfulness"},
  staged=True,
)

rubric_v2 = store.load("rubric.yaml", version=v2)
metrics_v2 = run_eval_harness(rubric_v2)

evidence_doc_v2 = {
  "kind": "eval",
  "name": "eval-run",
  "status": "pass",          # 100% accuracy clears the threshold
  "tool": "eval-harness",
  "created_at": "2026-05-28T13:00:00Z",
  "summary": "accuracy=100%",
  "metrics": metrics_v2,
}
add_evidence(manager.spec(), v2, evidence_path_v2)

gate_v2 = manager.gate(v2)
print(gate_v2.passed)   # True
```

---

## Step 5: Compare Evidence

`compare_evidence` diffs the attached evidence between two versions.

```python
from promptory.evidence import compare_evidence

comparison = compare_evidence(manager.spec(), v1, v2)

for change in comparison.changes:
  print(f"[{change.kind}] {change.name}: {change.before_status} -> {change.after_status}")
  for metric in change.metrics:
    print(f"  {metric.name}: {metric.before} -> {metric.after}")
```

Output:

```text
[eval] eval-run: fail -> pass
  accuracy: 0.6 -> 1.0
  false_positive_rate: 1.0 -> 0.0
  mean_score: 4.6 -> 3.4
```

---

## Step 6: Promote

`require_gates=True` makes the gate check part of the promotion call. If evidence is missing or fails, the call raises `PromptGateError` and `current.json` is not updated.

```python
manager.promote(v2, require_gates=True)
print(store.current_version())   # v0.0.2
```

`v1` remains staged. `v2` is now current.

---

## Running the Example

```bash
uv run python examples/evals2.py
```

Expected output:

```text
[v1 basic] staged v0.0.1
  accuracy=60%  fpr=100%  fnr=0%
  gate: FAIL - candidate stays staged

[v2 strict] staged v0.0.2
  accuracy=100%  fpr=0%  fnr=0%
  gate: PASS

Evidence comparison v0.0.1 -> v0.0.2:
  [eval] eval-run: fail -> pass
    accuracy: 0.6 -> 1.0
    false_positive_rate: 1.0 -> 0.0
    mean_score: 4.6 -> 3.4

Promoted v0.0.2 -> current: v0.0.2
```

---

## What Promptory Does Not Do

Promptory stores and validates the evidence document shape. It does not run evals, call LLMs, define metric thresholds, or decide whether a rubric is correct.
