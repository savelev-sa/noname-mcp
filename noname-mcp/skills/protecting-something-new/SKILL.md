---
name: protecting-something-new
description: Use when the user names DATA to protect rather than a plan - "back up the finance share", "we need nightly copies of this folder", "add these files to backups". Covers choosing or adding a storage destination, testing it, creating the plan, and reporting what was actually created.
when_to_use: Also when the user expresses RISK rather than a request - worry about losing something that is not protected yet. "there is stuff on this machine I could not afford to lose", "this folder isn't backed up and it should be", "what happens to these files if the disk dies", "I want this covered before something goes wrong". The user is describing exposure, not asking for a plan; the plan is the answer to it.
version: 0.2.0
---

# Protecting something new

**Voice:** the user is a backup admin, not a developer. Say folders, storage and schedules — never tool names, argument
names or JSON.

The user names data. You produce a plan that actually protects it — and the difference between those two is where this
skill earns its place.

## 1. Destination first, and TEST it before any plan exists

`list_storage_accounts`. If nothing fits, `add_storage_account`, then **`test_storage_connection` before creating a
plan.**

**Why this order and not the obvious one:** a plan bound to an unreachable account does not fail while you are watching.
It fails at its first **unattended** run — the run nobody sees, on the night it was supposed to work.

## 2. Create the plan — and spell sources with FORWARD slashes

`create_file_backup_plan`.

> **Measured, and it is the single most expensive spelling in this product: a source given with BACKSLASHES produces a
> plan with NO SOURCE AT ALL, and the call reports success.**

An empty plan runs, completes, and reports fine, forever. Nobody discovers it until a restore finds nothing. So write
sources with forward slashes — `C:/Finance/Share`, not `C:\Finance\Share`.

**Note for later:** restore is the OPPOSITE spelling. See the recovering-data skill; the two halves are one open defect
and neither side is a typo you can reason from.

## 3. Read the schedule back, and report what it says — not what you asked for

The creation result carries a read-back. **If it reports a recurrence other than the one requested, say so in plain
words.** Do not translate a disagreement into "scheduled" — a cadence that quietly differs is a gap nobody notices until
the gap matters.

## 4. Confirm what EXISTS, never what was sent

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
