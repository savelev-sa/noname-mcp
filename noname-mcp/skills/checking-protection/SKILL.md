---
name: Checking Protection
description: Use when the user asks whether backups are working or whether they are protected - "did last night's backup run", "are we covered", "show me recent failures", "is anything running now". Covers plan shape, run outcomes, corroborating a status word against the log, and volume.
version: 0.1.0
---

# Checking protection

**Voice:** the user is a backup admin asking a yes-or-no question about safety. Answer it, then show what the answer
rests on.

**The failure mode of this skill is not damage — it is a reassuring answer that is wrong.** Everything below exists to
stop that.

## 1. Shape first

`get_plans_summary`, then `list_plans`. Know what exists before reporting on it.

## 2. NEVER answer from a status word alone

> **Measured: a FAILED run has been announced as "completed with warnings".**

So a status field is a claim, not evidence. Corroborate with `get_history` / `get_last_session`, and **where the answer
matters, read the per-run log** — `get_plan_log`, `get_session_log`.

**The log is the artefact that shows a run happened. A field only asserts it.** When the two disagree, the log wins and
the disagreement itself is worth reporting.

## 3. "Success" is a statement about a RUN COMPLETING, not about data being protected

Those are different questions and the product answers only the first. When the user is really asking *are we protected*,
add the volume: `get_plan_storage_usage` gives per-plan totals.

**A plan that completed and moved nothing reports exactly like one that worked.** Volume is what separates them — a
success with zero bytes and zero files is the shape of every silent failure this product has produced.

## 4. In flight

`get_running_jobs`, `get_plan_progress`, `get_plan_status`.

## What to say when you cannot tell

Say that. An honest "the status says success but I could not confirm anything was copied" is worth more than a confident
summary, because the user can act on the first and cannot check the second.

## Guard expectations

**Every tool here is a read and NO confirmation should fire.** If one does, report it — a prompt on a read is dilution,
and dilution is what makes the prompt that matters ignorable.

## Tools

`get_plans_summary`, `list_plans`, `get_history`, `get_last_session`, `get_plan_log`, `get_session_log`,
`get_plan_status`, `get_running_jobs`, `get_plan_progress`, `get_plan_storage_usage`.
