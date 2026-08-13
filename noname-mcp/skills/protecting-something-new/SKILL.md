---
name: protecting-something-new
description: Use when the user names DATA to protect rather than a plan - "back up the finance share", "we need nightly copies of this folder", "add these files to backups". Covers choosing or adding a storage destination, testing it, creating the plan, and reporting what was actually created.
when_to_use: Also when the user expresses RISK rather than a request - worry about losing something that is not protected yet. "there is stuff on this machine I could not afford to lose", "this folder isn't backed up and it should be", "what happens to these files if the disk dies", "I want this covered before something goes wrong". The user is describing exposure, not asking for a plan; the plan is the answer to it.
version: 0.5.1
---

# Protecting something new

**Voice:** the user is a backup admin, not a developer. Say folders, storage and schedules — never tool names, argument
names or JSON.

The user names data. You produce a plan that actually protects it — and the difference between those two is where this
skill earns its place.

## 0. Is it a kind of plan this surface can create? Answer this FIRST

**Files and folders are the only kind available here today.** A whole disk, a database, a virtual machine belong to
families that are switched off on this surface. If that is what they described, say so before asking them anything at
all: it is not available here — neither "the product cannot do it" nor "it failed", since nothing ran.

**This is step 0 and not a note further down, deliberately.** Everything below asks the user for something: a
destination, a name, a retention they agree to. Discovering the family at the point of creation means all of it was
collected and then discarded, and a user whose answers evaporate learns that the questions here are provisional — which
is what makes the next one, the one that matters, get answered carelessly.

## 1. Destination first, and TEST it before any plan exists

`list_storage_accounts`. If nothing fits, `add_storage_account`, then **`test_storage_connection` before creating a
plan.**

**Why this order and not the obvious one:** a plan bound to an unreachable account does not fail while you are watching.
It fails at its first **unattended** run — the run nobody sees, on the night it was supposed to work.

## 2. Propose a name, then ASK — and do not create the plan until they answer

**Derive the name from the user's own words for the DATA.** *"Back up the finance share"* → build it from *finance
share*. They recognise their own phrase; they do not recognise ours.

Never from a path spelling — this product has an open defect about which slash a path takes, so a name with one baked in
is wrong on the other machine. Never a timestamp or a counter: those answer *when it was made*, which is the one question
nobody asks of a name. Never the hostname; the plan already knows where it lives.

**Read `list_plans` BEFORE you ask anything, and read it for TWO things.**

**First: is this data already protected?** If an existing plan already covers it, say so and stop — do not create a
second one, and **do not ask for a name you are not going to use.** A question whose answer gets discarded is worse
than no question: the user has now made a decision, and watching it evaporate teaches them that being asked here means
nothing.

**Second: is the proposed name free?** Uniqueness is not tidiness
here: the plan-reading tool resolves a name to an ID and **refuses when several plans share one**, listing the matches
instead of choosing. So a duplicate name **removes the by-name route to that plan for every later read** — including the
read-back that verifies what a plan actually carries. If the proposal collides, resolve it **with the user's own words**,
never by appending a number.

**Ask through the client's question/choice interface, and do not create the plan until they answer.** Offer the proposal,
**at least one genuine alternative**, and the option to type their own — a single option with a yes/no is a nudge wearing
a courtesy.

**Ask once.** If the plan already has a name, this step does not fire again.

**If they decline, or answer with something that is not a name: create the plan with the proposal anyway**, and say what
it was called and how to rename it. The boundary is that a name is never applied **silently** — not that a name is never
applied. Failing to protect data because a naming exchange stalled is the expensive error; a slightly wrong name is a
rename away from right. What this does not license: creating the plan while the question is still open, or reporting a
name as chosen when nothing was chosen — say which of the two happened.

## 3. Create the plan — and spell sources with FORWARD slashes

`create_file_backup_plan` — the only creating verb here, which step 0 already established.

> **Measured, and it is the single most expensive spelling in this product: a source given with BACKSLASHES produces a
> plan with NO SOURCE AT ALL, and the call reports success.**

An empty plan runs, completes, and reports fine, forever. Nobody discovers it until a restore finds nothing. So write
sources with forward slashes — `C:/Finance/Share`, not `C:\Finance\Share`.

**Note for later:** restore is the OPPOSITE spelling. See the recovering-data skill; the two halves are one open defect
and neither side is a typo you can reason from.

## 4. Read the schedule back, and report what it says — not what you asked for

The creation result carries a read-back. **If it reports a recurrence other than the one requested, say so in plain
words.** Do not translate a disagreement into "scheduled" — a cadence that quietly differs is a gap nobody notices until
the gap matters.

## 5. Confirm what EXISTS, never what was sent

`get_plan` / `list_plans`. A successful call means the request was accepted; only a read shows what the plan carries.

## Retention is a decision even when nobody mentions it

Saying nothing does not mean "no retention" — it inherits the machine default, and `get_retention_settings` is what that
default actually is. If retention is set or shortened, the creation result carries an **impact count**: relay it.

**Retention is armed deletion.** It removes nothing today and decides what disappears on the next unattended run, when
there is nobody to ask. So state what the user stops keeping, in versions and dates, and get agreement to THAT rather
than to a number.

## Guard expectations

**Nothing here is destructive and NO confirmation should fire** — creating a plan is additive. **If one does fire, that
is dilution and worth reporting:** a product that asks "are you sure?" about harmless things trains people to click
through the question that mattered.

The one consequence to state in words is the retention impact. That is a sentence, not a prompt.

## Tools

`list_storage_accounts`, `add_storage_account`, `test_storage_connection`, `create_file_backup_plan`, `get_plan`,
`list_plans`, `get_retention_settings`.
