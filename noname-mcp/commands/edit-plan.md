---
name: edit-plan
description: Change an existing backup plan - schedule, retention, sources, notification email - in place, without rebuilding it.
---

# /edit-plan - change an existing plan

Modify a plan the user already has. **Always in place. Never by rebuilding.** An in-place change keeps the plan's
identity, its session history and its link to the data already backed up; deleting and re-creating silently discards
all three, while looking like the same outcome to anyone reading the plan list afterwards.

**Be exact about which of those the data itself is.** Deleting a plan does NOT delete what it backed up — the stored
copies survive at the destination, and a separate tool exists for removing them. What a rebuild costs is the history
and the plan's association with those copies, not the copies. Say that plainly whenever a rebuild comes up: a user who
believes their backups died with the plan may go and do something far worse to recover from a loss that did not happen.

Plan updating is not in the promoted set - find the plan-update tool through the meta-tools (`search_tools` ->
`get_tool_info` -> `execute_tool`). Talk to the user in plain language: describe choices in words, not tool names
or field tokens.

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not
evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given
none of the caution a verb that sounds like it acts.

1. **Identify the plan.** `list_plans` if the user is unsure; if several match what they said, ask which one rather
   than guessing.
2. **Show what it looks like now** for the parts being changed - current schedule, retention, sources, failure-email
   setting - so the change is a comparison and not a leap. Read them BEFORE changing anything, and keep them: those
   values are the only way this product can put the plan back if the user changes their mind. An edit whose prior state
   nobody captured is not reversible by us, however small it looked — so if you could not read them, say the change
   cannot be undone from here before asking to proceed.
3. **Gather only what changes.** Leave everything the user did not mention alone; do not re-ask the whole wizard and
   do not resend unrelated settings.
   - **A new alert address is taken verbatim from the user or not changed at all.** Never infer one, never carry one
     over from earlier in the conversation, and never test it by sending: a test message is real mail, sent through the
     user's own SMTP account and appearing to come from them, to whichever address is named — and the tool accepts a
     caller-supplied one. **Leaving the address out is not the safe variant:** with none given it uses the address
     already saved, so the "connectivity check" still mails whoever is configured. No form of that call avoids sending.
     Ask first, name the recipient when asking, and send only to an address the user gave. Redirect
     this setting wrongly and every future failure report goes to a stranger instead of to them.
   - **THE BACKUP FORMAT IS THE ONE EDIT THAT CANNOT BE UNDONE.** Everything else on this page is reversible by
     editing again; this is not. The agent's own help states that once a plan's format is changed from current to new,
     *the return to the current format will not be possible*. Never change it to deliver some other option the user
     asked for — keeping EFS files encrypted and synthetic full both require the new format — without saying, before
     the call, that the format change is permanent and getting agreement to THAT and not merely to the feature. Note
     the trade runs both ways: block-level backup is **not compatible** with the new format, so this edit can remove a
     capability while adding one, and synthetic full is additionally **not supported by all storage providers**. If the
     user only wanted the feature, the honest answer may be that it is not available on this plan.
   - **RETENTION is different from the rest, and it is the one argument that needs naming here.** Shortening it does
     not delete anything now — it decides that older versions will be deleted later, on an unattended run, when there
     is nobody to ask. So the naming belongs at the moment of the choice: say what the new setting will remove on the
     next run of this named plan, in terms of what the user keeps and stops keeping, and get agreement to THAT rather
     than to a number. If you cannot tell how many versions fall outside the new setting, say so instead of implying
     the change is free.
   - Name, schedule and the notification address are not guarded. Asking about them spends the user's attention where
     nothing is at risk, which is its own defect.
4. **Summarize and confirm** before applying: what changes, from what, to what.
5. **Apply in place** with the update tool, then read the plan back and COMPARE it with what was asked — not merely
   check that a read succeeds. Whether the plan carries the retention, compression and exclusions requested is not
   verifiable from what we send, and retention is the setting most likely to be silently wrong while every call reports
   success; the user would find out at a restore. If the read disagrees with the request, or the setting cannot be read
   back, report that rather than success. An unconfirmable change is not an applied one.

**Never describe the plan as fully shown.** What this surface can read back is not everything a plan may carry: a plan
created outside it can hold a pre- or post-action that runs a command, and nothing here can report that — the only place
those parameter names appear is a refusal to accept them. So summarise what you changed and what you read, and do not
tell the user "this is your plan" as though the list were complete.

## When an in-place change is not possible

Some changes may not be expressible through an update. Then, in this order:

1. Say plainly what cannot be changed in place.
2. **Name what a rebuild would cost** - the plan's history and the association with data already backed up - and
   which parts survive. Never phrase it as "are you sure?".
   Unless `agentSupportState` is `Reviewed`, the SAME prompt must say so, worded per state (`agentVersion`,
   `agentSupportNote` from health): `OlderThanReviewedRange` → name both versions and that the cost you described was
   established against a different agent, the remedy being to update; `NewerThanAnythingReviewed` → name the installed
   and the newest reviewed version, say nothing is known to be wrong and that closing the gap is ours, never call it
   unsupported and never invite a change; `CannotBeDetermined` → say the version could not be read and nothing about
   being out of range. Never say "unsupported" in any state and never suggest downgrading the agent — downgrading the
   agent that holds the backup data destroys data through wording alone.
3. Let the user decide. If they decline, leave the plan untouched and say what they still have.
4. Only on an explicit yes: create the replacement, verify it, and tell them what was lost, not just what was made.

If the backup tools aren't available yet (setup not finished), don't expose internals - say a quick one-time setup
is needed and run `/setup` first.
