---
layout: default
title: What Do We Mean by LLM Chemistry?
math: true
mermaid: true
toc: true
---

## Why picking different models isn't the same as picking models that work well together

When I started working on LLM Chemistry, I was interested in a fairly practical
question: if you have several LLMs available, from different providers and with
different strengths and weaknesses, how do you know which ones should work
together?

Picking the strongest models seems reasonable, right? Picking models with
different strengths also seems reasonable. But neither tells you what will
actually happen when those models start collaborating, or whether they will make
each other better. That's the gap I was trying to capture with LLM Chemistry. 

The easiest way to explain the idea is with three questions:

- How good is a model? That's capability.
- How different are two models? That's diversity. 
- What happens to one model's contribution when another model joins the team?
  That's chemistry.

That last question is subtle. Two models can look very similar and still make a
terrible team. They might reinforce the same errors, contribute redundant
information, or simply fail to combine their strengths. Conversely, two models
that look dramatically different in capability and performance might interact
surprisingly well. The difference between the models matters, but so does what
happens when those differences meet. That's the idea behind LLM Chemistry.

So one of the ideas behind LLM Chemistry is:

> Diversity tells us how different models are. Chemistry tells us how those
  differences matter when they work together.

Since a former colleague and I published the [original LLM
Chemistry work](https://arxiv.org/abs/2510.03930),[^naming] I've come across
other research that makes this distinction especially interesting. One paper,
["You're Hired: Strategic Model Selection for LLM
Collaboration,"](https://arxiv.org/abs/2609.38816) directly studies how to
choose models for collaborative teams. Another, ["Emergent Alignment via
Competition,"](https://arxiv.org/abs/2509.15090) asks what happens when
differently motivated AI systems compete for a user's decisions.

They all involve heterogeneous collections of models, but they don't all ask
the same question, and even when they do, they approach it differently. Looking
at them side by side provides a useful way
to understand what LLM Chemistry is and what it isn't.

## Chemistry is about interaction

Suppose we have three models: A, B, and C.

A is our strongest individual model. If we're ranking models by performance, A
is an obvious choice. B has a very different performance profile. Perhaps it's
better at something A struggles with. A diversity-based strategy might therefore
conclude that A and B are a promising pair. 

But we still don't know whether B actually helps A. Maybe B catches errors that
A consistently misses. Maybe its critique causes A to reconsider a bad answer.
Or maybe B introduces noise and makes the final result worse.

Knowing that A and B are different doesn't tell us which of those things will
happen. LLM Chemistry approaches this by looking at marginal contribution.

Suppose we have an existing group of models. We can ask how much adding A
changes the performance of that group. In the paper, this is expressed using a
benefit function derived from the change in the cost of answering a user query:

$$
benefit_Q(X,Y)=cost_Q(Y)-cost_Q(X \cup Y).
$$

Here, $$Y$$ is the existing group and $$X$$ is the set being added. The benefit
can even be negative: adding a model can increase the cost and degrade
performance.

Okay, now add B to the picture. Instead of asking whether A and B are similar,
we ask:

> Does the value contributed by A change when B is present?

Dropping $$Q$$ and writing $$X$$ for the existing group, we compare:
$$
benefit(A,X)
$$

with:
$$
benefit(A,X\cup\{B\}).
$$

The difference between those quantities gives us what I call an _interaction effect_:
$$
\Delta(A,B,X)=|benefit(A,X)-benefit(A,X\cup\{B\})|.
$$

The full chemistry definition takes the maximum of this interaction effect over
possible surrounding configurations $$X$$, normalized by the cost of the
resulting configuration.

The equation matters, but the intuition is simpler:

> B matters to A if A's contribution changes because B is there.

And that's the relationship I'm trying to detect.

## Where diversity enters the picture

So far, I've used diversity mostly as a contrast: the thing chemistry is _not_.
But that doesn't mean diversity is irrelevant. If chemistry measures how models
interact, where do their differences come in? This is where one of the
theoretical results from the original paper becomes important.

Theorem 1 says that chemistry emerges when models exhibit heterogeneous
performance profiles. If models have identical—or nearly identical—performance
profiles, the _cost-based_ selection pressure disappears and there is no
interaction effect for the framework to detect. 

In other words, performance heterogeneity creates the conditions under which
chemistry can emerge. The corollary goes further and connects chemistry to the
amount of performance diversity, while noting that the direction of that
relationship depends on the task. This distinction is important:

> Diversity is not irrelevant to chemistry. It is one of the conditions that makes chemistry possible.

But diversity alone doesn't tell us what the resulting interaction means for the
team. The same heterogeneous performance profiles can produce useful
complementarity, or they can produce interactions that don't improve the final
result.

The experiments reflect the task dependence the corollary predicts.
Chemistry-based selection improved effectiveness in some tasks and group sizes,
was effectively neutral in others, and underperformed in one small-group
summarization setting. So a more precise way to put the relationship is:

> Diversity is a necessary condition for chemistry, but it is not sufficient.
  Chemistry is what tells us whether the diversity is useful.

This is why I wouldn't summarize the idea as "choose the most diverse models."
That would be misleading. The real question is what those differences do once
the models interact.

## Chemistry is also a selection signal

Measuring interaction effects is useful diagnostically, but that wasn't the
final goal of the work. The practical objective was still the question I started
with:

> Which models should work together?

That's why LLM Chemistry includes two related pieces: the _CHEME_ and
_RECOMMEND_ algorithms. CHEME estimates chemistry among candidate models by
measuring interaction effects across configurations. RECOMMEND uses those
estimates to search for model combinations that capture strong chemistry while
accounting for the cost of the resulting team.

The paper describes the objective as recommending a set of LLMs that maximizes
the benefit of collaboration while minimizing the cost of answering the query.
Conceptually, the pipeline looks like this:

<img src="/static/figs/llm-chemistry-pipeline.png" alt="LLM Chemistry pipeline: performance histories, capture joint LLM impact on query answers, chemistry table generator, recommend LLMs with strong chemistry" style="max-width:100%;height:auto;">

Read left to right, the figure shows chemistry being estimated from past
performance and then used to choose the team. LLM Chemistry isn't only a way to
measure how models interact; it turns that interaction into information for
team selection.

## A newer paper asks a familiar question

Treating chemistry as a selection signal is what made ["You're Hired: Strategic
Model Selection for LLM Collaboration"](https://arxiv.org/abs/2609.38816) by Cao
et al. particularly interesting to me.

The paper asks:

> How should we select models to form an effective collaborative team?

Its setup is straightforward. Given a candidate model pool $$M$$ and a desired
team size $$n$$, a selector chooses a subset $$T$$:

$$
\sigma(M,n)=T.
$$

At that level, the problem should sound familiar. LLM Chemistry also asks how we
can identify which models should collaborate. In fact, our original paper
explicitly frames its central question as identifying which LLMs "work best
together" and introduces RECOMMEND for selecting model combinations with strong
chemistry.

The interesting difference is how the two approaches characterize potential
collaborators. The "You're Hired" paper explores a broad taxonomy of signals:
model descriptions, behavioral idiosyncrasies, Item Response Theory
representations, benchmark performance profiles, combinations of capability and
description information, and LLM-based recruiters. In the performance-profile
approach, for example, models are represented by performance vectors across
benchmarks and compared through the similarity of those vectors. That's close
to the diversity signal I discussed earlier: useful for telling models apart,
but not on its own a measure of how they'll interact.

Put simply, many of these approaches ask:

> What do we know about these models that might tell us who should be on the team?

LLM Chemistry, on the other hand, comes at the problem from another direction:

> What have we learned from what happens when these models are actually together?

One reasons from model characteristics toward the team. The other reasons from
observed interaction toward the team. Those aren't mutually exclusive
approaches. In fact, they may ultimately be complementary.

## "Team composition cannot be decoupled from team interaction"

One result in the "You're Hired" paper stood out to me in particular. The
authors found that a selection method that produces a strong team under one
collaboration mechanism can perform poorly under another. They concluded:

> "team composition cannot be decoupled from team interaction."

By "team interaction," the authors mean the collaboration mechanism (how the
team refines, fuses, or merges its outputs) rather than interaction effects in
the sense I've used here. But the lesson points in the same direction.

That result is interesting when viewed through the lens of chemistry. If
collaborative performance were determined primarily by individual model
strength, we could rank the models and select the top $$n$$. If it were
determined primarily by diversity, we could maximize some measure of difference.
But if the best team changes with how the models work together, neither
capability nor diversity is enough on its own, and that's the gap chemistry is
meant to fill.

## Different doesn't necessarily mean useful

The "You're Hired" paper also illustrates why diversity alone can be tricky. As
the authors increase the diversity of the available model pool, additional
distinct models initially help some selectors. But eventually the gains can
saturate or reverse.

A weak model can also be an unusual model.

A selection method that rewards difference without sufficiently accounting for
capability can therefore select weak outliers precisely because they look
distinctive. The paper concludes that maximizing distinctness alone isn't
enough; effective selection has to balance diversity with capability.

This brings us back to the three questions from the start:

- Capability: How good is this model?
- Diversity: How different are these models?
- Chemistry: How does one model's contribution change in the presence of another?

They're related questions, but they aren't interchangeable. And this makes the
complementarity I mentioned earlier more concrete: capability and diversity are
built from per-model signals, so collecting them scales with the size of the
pool rather than the number of possible teams. That makes them natural for
narrowing a large pool, while interaction-aware estimation could help
distinguish among the remaining combinations. I'll come back to that.

## What about "Emergent Alignment via Competition"?

"You're Hired" shows that differences in capability can saturate or mislead.
But models can also differ in what they're trying to achieve, and that's where a
second paper, ["Emergent Alignment via
Competition,"](https://arxiv.org/abs/2509.15090) comes in. At first glance, it
looks related: it also considers heterogeneous AI systems and explicitly
motivates a world in which models come from different providers with potentially
different incentives. But the similarity is mostly at the setting level.

The paper asks whether a human interacting with multiple differently misaligned
AI agents can nevertheless obtain outcomes comparable to interacting with a
perfectly aligned model.

Its central assumption is that the user's utility function can be approximated
by a weighted combination of the AI agents' utility functions—roughly, that it
lies in their convex hull. The mechanism is then strategic competition.

So although both papers involve heterogeneous collections of models, they're
trying to accomplish different things.

LLM Chemistry asks:

> Which models work well together on a collaborative task?

"Emergent Alignment via Competition" asks:

> Can competition among differently aligned models produce outcomes that are good for the user?

The first is fundamentally a collaborator-selection and interaction problem. The
second is fundamentally a strategic alignment and mechanism-design problem.

That's an important distinction because it shows just how many different things
we can mean when we talk about "diverse models."

## Diversity isn't one thing

Putting these papers next to each other helped clarify something for me. We
often talk about model diversity as though it were a single property. It isn't.

Models can differ in many ways: in architecture and training, in capability and
observed behavior, in performance profiles, and in their objectives or
incentives. Those differences aren't interchangeable.

In "Emergent Alignment via Competition," the important heterogeneity is
primarily in utility functions and incentives, while in "You're Hired," candidate models
are characterized through capability, behavior, descriptions, performance
profiles, and related signals.

In LLM Chemistry, the theoretical connection is specifically to heterogeneous
performance characteristics—the quality and accuracy profiles used by the
framework—and to the interaction dependencies that emerge from them.

That suggests that instead of asking:

> Should we use diverse models?

we might ask:

> Different in what way?

Then:

> Different for what purpose?

And finally:

> What happens when those differences meet?

That last question is where chemistry begins.

## The question I think comes next

Earlier, I said I'd come back to how these signals might work together.
Comparing these papers leaves me with a question I find more interesting than
deciding whether capability, diversity, or chemistry is the "right" selection
signal:

> When can capability and diversity predict chemistry—and when do we actually
  need to measure interaction?

Measuring interaction is the expensive part. To learn how models affect one
another, we need evidence from collaborative configurations, and the number of
possible configurations grows combinatorially with the size of the pool.
Capability and diversity signals, by contrast, are collected per model. That
suggests a possible hierarchy:

<img src="/static/figs/llm-chemistry-hierarchy.png" alt="A possible selection hierarchy: a large model pool goes through capability filtering and diversity or behavioral screening to produce a smaller candidate pool, then chemistry estimation and interaction-aware recommendation" style="max-width:100%;height:auto;">

In that picture, capability and diversity aren't alternatives to chemistry.
They could serve as priors for where chemistry is worth measuring.

That opens several other questions:

- Does chemistry remain stable when the collaboration mechanism changes?
- Can two models have useful chemistry for one task and poor chemistry for
  another?
- How does chemistry change when one of the underlying models is updated?
- If chemistry-, capability-, and diversity-based selectors were compared on
  the same pools, tasks, and collaboration mechanisms, when would each one win?

Those are empirical questions. But the conceptual question underneath them is
the same one that motivated LLM Chemistry in the first place. When building a
multi-LLM system, it isn't enough to ask how good the models are, or how
different they are. We also need to ask:

> What happens to their contributions when they work together?

That's what we mean by LLM Chemistry.

## Footnotes

[^naming]: In hindsight, we probably should have titled the paper "LLM
    Chemistry Estimation for Multi-LLM *Team* Recommendation." That would have
    been more accurate, but it's a mouthful, so we dropped "Team." That was
    probably a mistake: without it, it's easy to read the work as recommending
    individual models, when the point is recommending models that work well
    together.
