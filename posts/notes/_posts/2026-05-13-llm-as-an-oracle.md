---
layout: default
title: LLM as an Oracle
toc: true
---

Task-specific LLM evaluation used to mean reference-based metrics and test
suites, with human raters for anything open-ended. Then LLM-as-a-Judge made
judgment cheap, and the conversation shifted to which judge model is best for a
given task. That's the wrong first question. The first question should be
whether the task needs _judgment_ or _verification_, two evaluation modes that
rely on different kinds of evidence. Judgment fits tasks that are open-ended,
subjective, or otherwise difficult to reduce to executable checks. It relies on
rubrics, preferences, or expert opinion. Verification fits tasks that are backed
by stronger evidence: ground truth, test cases, or expected behavioral
properties like performance.

Get this wrong and the evaluation fails in both directions. A rubric can tell
you whether an explanation is clear or persuasive, but it's a weak substitute
for test cases when you're evaluating code. Exact-match checks against ground
truth fail the other way: they fall apart the moment the output is qualitative.

Avoiding that mismatch is what led to
[`llm-as-an-oracle`](https://github.com/hsanchez/llm-as-an-oracle). An Oracle
here isn't an all-knowing model. It's
an adaptive decision layer that determines whether a task needs judgment or
verification, then routes it to an _LLM-as-a-Judge_ or an _LLM-as-a-Verifier_.

The central claim is simple:

> Evaluation should be routed to the strategy that best matches the structure
> of the task.

That sounds obvious, but it's easy to violate in practice. As soon as a
benchmark, agent workflow, or production pipeline standardizes on a single
evaluator, it treats fundamentally different tasks as though they required the
same kind of evidence. Finding the best judge model doesn't fix that; it just
decides which evaluator gets applied to everything.

Here's what that looks like in practice. Later in this post, three agents fix
the same N+1 query bug. Two of them change the query shape. The third wraps the
buggy call in an `lru_cache` and looks correct — familiar technique, concrete
code, a plausible performance story. A Judge scoring on presentation alone can
be fooled by it. A Verifier running the test suite cannot. That gap between
looking right and being right is what the Oracle is built to catch.

## The evaluation problem

Human evaluation remains the reference point for many LLM systems. Humans can
interpret incomplete instructions, account for context, distinguish severity
from style, and notice when an answer is technically correct but pragmatically
poor. But human evaluation scales badly, which created demand for automated
alternatives. Traditional metrics help, but each covers a narrow slice:

- exact match works when the answer space is constrained
- unit tests work when executable behavior matters
- overlap metrics work in narrow summarization settings

Unfortunately, none of these solves the broader evaluation problem on its own.

Capable instruction-following models added a new option: LLM-based evaluators.
They've produced a family of `LLM-as-*` patterns, each with its own line of
research:[^llm-as-family]

- `LLM-as-a-Judge`
- `LLM-as-a-Verifier`
- `LLM-as-a-Critic`
- `LLM-as-a-Ranker`

These patterns are often discussed as alternatives. They're better understood as
tools with different operating assumptions, especially about what evidence is
available. Critics and rankers produce assessments rather than checks, so they
sit on the judgment side; this post focuses on the Judge and Verifier. So the
useful question isn't which pattern, or which judge model, is best. It's the one
from the start: 

> Does this task need judgment or verification?

## Judge and Verifier solve different problems

The Oracle routes between two strategies, one for each evaluation mode.

### LLM-as-a-Judge

An `LLM-as-a-Judge` performs holistic evaluation. It reads the task, a candidate
trajectory (the full solution attempt, not just the final answer), and the
evaluation criteria, then emits a score or preference.[^judge] It's the natural
fit for judgment tasks, such as:

- Is this answer concise without omitting important details?
- Does this explanation match the user's level of expertise?
- Which recommendation is more useful under vague constraints?
- Is the reasoning persuasive and coherent?

None of these collapse into executable checks. _They require interpretation._
That doesn't make a Judge "ask another model what it thinks": in
`llm-as-an-oracle`, it scores against weighted rubric criteria and swaps
pairwise order to reduce positional bias.

### LLM-as-a-Verifier

An `LLM-as-a-Verifier` evaluates trajectories against signals closer to
correctness than preference.[^verifier] It's the natural fit for verification
tasks, such as:

- code generation with tests
- question answering with reference answers
- tool-use traces with expected outputs
- structured reasoning tasks with decomposable criteria

Rather than settle for a single coarse score, the Verifier tries to extract
finer-grained signal: it decomposes criteria, repeats verification, and uses
token log probabilities when the provider exposes them.

The Judge asks which trajectory seems better under a rubric; the Verifier asks
which survives the strongest evidence-sensitive checks available. Related
questions, but not the same one.

## What the Oracle adds

If Judge and Verifier are both useful, a natural response is to expose both and
let the caller choose. That's necessary but not sufficient. Many workflows mix
task types:

- an agent may produce code patches, explanations, and planning notes
- a benchmark may combine factual QA, long-form reasoning, and executable tasks
- a production system may need to evaluate recommendations, SQL, and tool calls
  within the same pipeline

In those settings, asking the caller to pick an evaluator every time creates
friction and invites inconsistency.

The Oracle removes that step. It inspects the task and its trajectories, picks
the evaluator that fits better, runs only that one, and returns the result
along with an explanation of the choice. It isn't a third evaluator; it sits
above the two.

## Anatomy of the Oracle router

The part of the Oracle that makes this choice is the router. The default router
in `llm-as-an-oracle` is deterministic: it doesn't call an LLM to decide which
evaluator to use. Instead, it extracts interpretable signals and applies a
fixed chain of routing policies. That's deliberate: evaluator selection should
become more legible, not less.

<img src="/static/figs/llm-as-an-oracle.jpg" alt="LLM as an Oracle routing diagram" style="max-width:100%;height:auto;">

### Step 1: extract routing signals

The router converts the task and trajectories into a structured set of signals.
The current implementation uses features such as:

- `has_ground_truth`
- `has_test_cases`
- `trajectory_count`
- `stated_difficulty`
- `verifiable_keyword_density`
- `judgment_keyword_density`
- `problem_length`
- `output_available`
- `prior_hardness`

The goal is not to perfectly infer task type from text. The goal is to make the
selection logic explicit enough to inspect, revise, and extend.

### Step 2: collect policy votes

Signals are passed through a chain of policies, roughly one per signal group.
Each policy casts a weighted vote for either `Judge` or `Verifier`.

Conceptually:
```text
Ground truth or test cases present?  -> favor Verifier
Execution output available?          -> favor Verifier
Previously observed as hard?         -> favor Verifier
Open-ended wording?                  -> favor Judge
```

The implementation is more nuanced than that sketch, but the spirit is the
same: evaluation mode is chosen by accumulating evidence.

### Step 3: aggregate confidence

The router aggregates the weighted votes into a final confidence score. The
winning strategy is selected only if its confidence is strong enough; otherwise,
the system falls back to the more general-purpose Judge path.

This separates a strategy's power from its fit. A Verifier can be the stronger
tool and still be the wrong one when the evidence for this task doesn't justify
it. That's a better design than letting every downstream evaluator silently
assume the task suits its own strengths.

### Step 4: expose the routing trace

The output of a routing decision includes:

- the selected strategy
- the final confidence
- the raw signals
- every policy vote
- a human-readable reasoning trace

I care about this part the most, because evaluation pipelines already accumulate
ambiguity, and a score you can't trace is hard to debug. The trace makes one
critical source of ambiguity observable: why this evaluator was chosen in the
first place.

## Evaluating trajectories, not just answers

The project uses the term `trajectory` deliberately.

A trajectory is a candidate task-solving attempt. It may contain:

- the final answer
- intermediate reasoning or planning
- code
- tool calls
- execution output
- an optional reward signal

This is especially relevant for agents. When a coding agent fixes a bug, the
thing we care about is not only the final patch. We may care about:

- whether the patch addresses the requested failure mode
- whether it satisfies explicit requirements
- whether execution evidence supports the answer
- whether two superficially plausible solutions differ materially

For text-only tasks, evaluating the final answer may be sufficient. For agents,
the evaluation object often needs to be richer.

The Oracle architecture assumes that richer object from the beginning.

## A concrete example: the N+1 query bug

One example in the repository asks three agents to fix an N+1 query problem.
The original function loads orders first, then issues one SQL query per order to
load items. That means:

- 51 queries for 50 orders
- 5,001 queries for 5,000 orders

The task asks for a constant-query solution and provides both ground truth and
test cases.

The original bug has this shape:

```python
def get_orders_with_items(user_id: int) -> list[dict]:
    orders = db.execute(
        "SELECT * FROM orders WHERE user_id = ?",
        [user_id],
    )

    for order in orders:
        order["items"] = db.execute(
            "SELECT * FROM items WHERE order_id = ?",
            [order["id"]],
        )

    return orders
```

The loop is the problem. The first query fetches the orders, then each order
triggers another query for its items.

Three candidate trajectories are evaluated:

1. one rewrites the query with a `JOIN`
2. one performs a batched prefetch with `WHERE IN`
3. one adds an `lru_cache` around the inner item lookup

The first two are legitimate fixes, though they make different tradeoffs. The
third sounds plausible because caching often improves performance. But it does
not solve the stated problem. On a cold cache, query count still grows with the
number of orders.

The misleading fix looks like this:

```python
@lru_cache(maxsize=256)
def fetch_items(order_id: int) -> list[dict]:
    return db.execute(
        "SELECT * FROM items WHERE order_id = ?",
        [order_id],
    )


def get_orders_with_items(user_id: int) -> list[dict]:
    orders = db.execute(
        "SELECT * FROM orders WHERE user_id = ?",
        [user_id],
    )

    for order in orders:
        order["items"] = fetch_items(order["id"])

    return orders
```

This may help repeated calls for the same order, but it does not change the
first-run query pattern:

```text
expected: query_count == O(1)
actual:   query_count == 1 + number_of_orders
```

A real fix changes the query shape. For example, the `JOIN` trajectory uses one
SQL query and groups the rows afterward:

```sql
SELECT o.*, i.*
FROM orders o
LEFT JOIN items i ON i.order_id = o.id
WHERE o.user_id = ?;
```

This is exactly the sort of case where evaluator choice matters.

### Why Judge alone is risky here

A holistic Judge may recognize that the cache-based answer is weaker. But it is
also possible for that answer to benefit from surface plausibility:

- it uses a familiar optimization technique
- it contains concrete code
- it appears to address performance

If the score is driven too much by presentation quality, the wrong candidate can
become competitive.

### Why Verifier is the better fit

The task has stronger evidence:

- explicit correctness requirements
- test cases
- expected behavioral properties
- a measurable performance invariant: query count must not scale with `N`

That is precisely the situation where the Oracle should route toward the
Verifier. The evaluation problem is not mainly aesthetic. It is evidential.

The interesting part is not merely that Verifier can help. The more general point
is that the Oracle can identify this task shape before evaluation begins.

## Judge and Verifier are not rivals

It is tempting to treat this as a winner-take-all comparison:

- Verifier is more objective
- Judge is more flexible
- one must be superior

I do not think that framing is useful.

Each strategy fails differently.

### Failure modes of Judge

A Judge can overvalue fluent or confident language, blur correctness and
style, and struggle to separate close technical alternatives without stronger
evidence.

### Failure modes of Verifier

A Verifier has its own failure modes. It inherits bad ground truth, can
overfit to incomplete criteria, becomes brittle when tests are narrow, and
quietly underperforms on tasks that are fundamentally subjective.

The Oracle does not eliminate these problems. It tries to reduce one avoidable
problem: choosing the wrong mode of evaluation for the task at hand.

## When the Oracle should ask for help

There is another failure mode worth making explicit: sometimes the task itself
is underspecified.

Suppose three architecture recommendations are all defensible, but the best one
depends on a missing fact about team size, latency goals, compliance constraints,
or deployment environment. No evaluator should pretend confidence if the
information needed to decide was never supplied.

The fuller design in this project explores a `Human Oracle` escalation path for
those cases. When evaluation evidence runs out, the system can ask a targeted
clarifying question, incorporate the answer, and re-evaluate.

The point is not to put a person in the loop by default. It is to avoid
manufactured certainty when a decision depends on missing context.

That same principle motivates the router itself:

- do not hide assumptions
- do not oversell confidence
- make uncertainty inspectable

## What this suggests about evaluation design

The Oracle pattern leads to a broader design lesson.

Good evaluation systems share a few properties. **Evaluator should match task
structure**: open-ended and evidence-grounded tasks are different, and treating
them the same introduces avoidable error. **Selection should be explicit**,
part of the system design rather than a hidden convention buried in notebook
code or benchmark glue. **Inspectability should be preserved**: routing
traces, criteria, and confidence should be artifacts you can actually look at.
And the system should **admit when evidence is insufficient**. A strong
evaluator is no substitute for missing context, and escalation can be the
right move.

## Where this pattern is useful

I think `LLM-as-an-Oracle` is especially relevant for:

- coding agents that generate several candidate patches
- benchmark pipelines that mix factual, creative, and executable tasks
- tool-using agents whose outputs include both text and action traces
- research workflows comparing evaluators across heterogeneous task families
- production systems that want one evaluation interface without pretending every
  task should be judged the same way

In all of those cases, evaluator selection is part of the problem.

Treating it as a first-class system component is cleaner than standardizing on a
single evaluation method and compensating later with increasingly elaborate
exceptions.

## Closing thought

The evaluator should fit the task.

`LLM-as-an-Oracle` is my attempt to turn that principle into a concrete system:
route between judgment and verification, expose the reasons for the choice, and
leave room for human escalation when neither automated path has enough evidence.

[^llm-as-family]: Zheng et al. introduce `LLM-as-a-Judge`; the
    `LLM-as-a-Verifier` framework develops evidence-sensitive verification;
    `CritiqueLLM` studies critique generation for evaluation; and pairwise
    ranking prompting shows how LLMs can be used directly as rankers.
    <https://arxiv.org/abs/2306.05685>
    <https://llm-as-a-verifier.notion.site/>
    <https://arxiv.org/abs/2311.18702>
    <https://arxiv.org/abs/2306.17563>

[^judge]: Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot
    Arena," 2023. <https://arxiv.org/abs/2306.05685>

[^verifier]: "LLM-as-a-Verifier: A General-Purpose Verification Framework."
    <https://llm-as-a-verifier.notion.site/>
