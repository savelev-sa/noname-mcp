---
name: Moving a Destination
description: Use when the user wants to change where backups go or rotate storage credentials - "point backups at the new bucket", "rotate the keys", "move this plan to different storage", "remove this storage account". Covers finding what is bound to an account, the fold-back nobody expects, and testing afterwards.
version: 0.1.0
---

# Moving a destination

**Voice:** the user is a backup admin. Say "storage account", "which plans use it", "how many are affected".

**The one thing this skill exists to prevent: the only way to redirect one plan changes EVERY plan bound to that
account.** Nothing in the surface hints at that, and the natural request — "move this plan" — has no tool behind it.

## 1. Find who is bound to the account

`list_storage_accounts`, `list_plans`, `get_plan`. Binding is set at plan creation and is visible on the plan;
`get_storage_account` for the account's own details.

## 2. Name the fold-back BEFORE acting

**No plan-editing tool takes a destination.** Editing the account with `update_storage_account` **redirects every plan
bound to it**.

**Say how many — with the count and the plan names — not "this will update the account".** The second sentence is true
and tells the user nothing about what is about to happen to plans they were not thinking about.

## 3. Test after changing

`test_storage_connection`. A redirected account that cannot be reached fails at the first unattended run, which is the
run nobody watches.

## 4. If the intent is to move ONE plan, this is the wrong tool

The only plan-side route is **delete and recreate**, and that discards the plan's identity and its **session history**.

**Name that cost first, and say plainly that it is usually not worth it.** Also say what a rebuild does NOT cost: the
stored copies at the destination survive — a user who believes their backups die with the plan may do something far worse
to recover from a loss that did not happen.

## Guard expectations

**`update_storage_account` and `delete_storage_account` are both guarded, and both name what is lost.**

**Removing an account does NOT delete the data at the destination.** Say so, unprompted — the fear is reasonable, and the
answer is both reassuring and true. Withholding it leaves the user to assume the worse of two possibilities at the moment
they are deciding.

## Tools

`list_storage_accounts`, `list_plans`, `get_plan`, `get_storage_account`, `update_storage_account`,
`test_storage_connection`, `delete_storage_account`.
