---
name: new-plan
description: Guided creation and scheduling of a file backup plan (sources, destination, encryption, compression, retention, failure email).
---

# /new-plan - create a file backup plan

Walk the user through creating and scheduling a file backup plan, using the plan-creation tools (e.g. `create_file_backup_plan`). Talk to the user in plain, non-technical language — describe choices in words, not tool or field tokens.

Gather, confirming each: sources (folders), destination (an existing one from `/destinations`), schedule, encryption, compression, retention, and failure-email alert. Then **show a summary and ask the user to confirm before creating** the plan.

**Retention deserves a sentence of its own, not a slot in the summary.** It is the one setting here that decides a future
deletion: whatever it says will be applied later by unattended runs, with nobody present to ask. So state in plain words
what the plan will keep and what it will stop keeping, and let the user agree to that rather than to a number. The other
settings are reversible by editing the plan; versions already removed under a retention rule are not.

After creation, confirm the plan was saved. If the backup tools aren't available yet (setup not finished), don't expose internals — just tell the user a quick one-time setup is needed and run `/setup` first.

**Changing a plan that already exists: EDIT it, never delete and re-create.** There is no `/edit-plan` command, but
the capability exists — find the plan-update tool through the meta-tools (`search_tools` -> `execute_tool`) and use

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.
it. This matters because delete-and-recreate looks equivalent and is not: it discards the plan's identity, its
session history and the backup data associated with it. If a user asks for a change you cannot make through an
update, say what would be lost before offering to rebuild the plan, and let them decide — the loss is theirs to
accept, not yours to spend on convenience.
