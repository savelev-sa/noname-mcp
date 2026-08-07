---
name: recovering-data
description: Use when the user has already lost something - "I deleted it", "I need yesterday's version", "the disk died", "can we get this file back". Covers finding restore points, browsing what exists, choosing a restore route, and stating overwrite consequences before acting.
version: 0.1.0
---

# Recovering data

**Voice:** the user is a backup admin who has just lost something, and possibly under pressure. Plain language, no tool
names, no hedging that reads as reluctance.

**This is the most consequential skill in the set, and the reason is specific: two of its failure modes are SILENT
SUCCESSES.** A restore can report success and recover nothing, at the exact moment the person is least able to check.

## 1. Find what exists

`list_restore_points`, then `browse_restore_tree`. Never guess a path from what the user typed — read what is actually
stored.

## 2. Use the spelling the BROWSE returned

> **The archive stores BACKSLASHES and the restore matches LITERALLY. A forward-slash spelling of the same file returns
> NOTHING AT ALL, with no error.**

So carry the spelling from `browse_restore_tree` through to the restore call, unaltered. Do not normalise it, do not
tidy it.

**And note the trap: this is the OPPOSITE spelling to plan creation**, where a backslash source silently produces an
empty plan. The two are the halves of one open defect. Neither is a convention you can reason from — each side has to be
used as measured.

## 3. Choose the route

- `quick_restore` — the latest version, in place or to a folder.
- `restore_files` — another location, more options.

## 4. State the overwrite semantics BEFORE acting — both halves, always

**Overwrite ON:** the current file **is replaced**, possibly by an **older** copy. This product cannot bring the
replaced version back unless it too happens to be in a backup — **and it does not check**.

**Overwrite OFF:** an existing file is **left alone**. So a restore in place can **report success and recover nothing** —
the user reads "done" and still does not have their file.

Both halves, every time. Naming only the destructive one makes the safe-sounding option look free, and it is not.

## 5. Verify against what LANDED, not against the exit code

The result names where files went — read that. `get_restore_status` for a run in flight, `cancel_restore` to stop one.

## Guard expectations

**`quick_restore` and `restore_files` are guarded ON THE OVERWRITE ARGUMENT, not on the tool.** A restore into an empty
folder must not prompt — the prompt exists for replacement, and firing it when nothing can be replaced is the dilution
that teaches people to click through.

**No licence state, and no error anywhere else in this product, is EVER a reason to discourage a restore.** The asymmetry
decides it: wrongly attempting a restore costs one failed command; wrongly discouraging one costs the backup this
product exists to provide. If something is genuinely broken, attempt it anyway and report what the product said.

## Tools

`list_restore_points`, `browse_restore_tree`, `quick_restore`, `restore_files`, `get_restore_status`, `cancel_restore`.
