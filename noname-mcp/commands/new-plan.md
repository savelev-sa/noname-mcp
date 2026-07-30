---
name: new-plan
description: Guided creation and scheduling of a file backup plan (sources, destination, encryption, compression, retention, failure email).
---

# /new-plan - create a file backup plan

Walk the user through creating and scheduling a file backup plan, using the plan-creation tools (e.g. `create_file_backup_plan`). Talk to the user in plain, non-technical language — describe choices in words, not tool or field tokens.

Gather, confirming each: sources (folders), destination (an existing one from `/destinations`), schedule, encryption, compression, retention, and failure-email alert. Then **show a summary and ask the user to confirm before creating** the plan.

**The alert address is the one setting that leaves the machine, so take it verbatim and never invent it.** Use the
address the user gave, in the words they gave it. Never infer one from an account name, a licence record or anything
earlier in the conversation, and never offer a "probably this one" — a plausible wrong address quietly sends this
user's backup reports, including what they back up and when it fails, to a stranger.

The same applies harder to testing it: sending a test message is not an inspection. It sends real mail through the
user's own SMTP account, appearing to come from them, to whichever address is named — and the tool accepts an address
the CALLER supplies rather than only the saved one. Ask before sending, name the recipient in the asking, and never
send to an address the user did not give you. Nothing here can recall a message once it has gone.

**Retention deserves a sentence of its own, not a slot in the summary.** It is the one setting here that decides a future
deletion: whatever it says will be applied later by unattended runs, with nobody present to ask. So state in plain words
what the plan will keep and what it will stop keeping, and let the user agree to that rather than to a number. The other
settings are reversible by editing the plan; versions already removed under a retention rule are not.

**After creation, read the plan back and compare it with what the user asked for** — do not report success from the
creation call's own answer. Check specifically the settings that decide what "backed up" MEANS: retention, compression,
and any exclusions. Whether a created plan actually carries them is not verifiable from what we send, and retention is
the one most likely to be silently wrong while everything reports fine — the user would discover it at a restore, when
it decides how far back they can reach. If a setting disagrees with what was asked, or cannot be read back at all, say
that instead of confirming; an unconfirmable setting is not a saved one.

After that, confirm the plan was saved. If the backup tools aren't available yet (setup not finished), don't expose internals — just tell the user a quick one-time setup is needed and run `/setup` first.

**Changing a plan that already exists: EDIT it, never delete and re-create.** There is no `/edit-plan` command, but
the capability exists — find the plan-update tool through the meta-tools (`search_tools` -> `execute_tool`) and use

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.
it. This matters because delete-and-recreate looks equivalent and is not: it discards the plan's identity, its
session history and the backup data associated with it. If a user asks for a change you cannot make through an
update, say what would be lost before offering to rebuild the plan, and let them decide — the loss is theirs to
accept, not yours to spend on convenience.
