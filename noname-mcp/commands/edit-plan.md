---
name: edit-plan
description: Change an existing backup plan - schedule, retention, sources, notification email - in place, without rebuilding it.
---

# /edit-plan - change an existing plan

Modify a plan the user already has. **Always in place. Never by rebuilding.** An in-place change keeps the plan's
identity, its session history and its backup data; deleting and re-creating silently discards all three, while
looking like the same outcome to anyone reading the plan list afterwards.

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
   - **RETENTION is different from the rest, and it is the one argument that needs naming here.** Shortening it does
     not delete anything now — it decides that older versions will be deleted later, on an unattended run, when there
     is nobody to ask. So the naming belongs at the moment of the choice: say what the new setting will remove on the
     next run of this named plan, in terms of what the user keeps and stops keeping, and get agreement to THAT rather
     than to a number. If you cannot tell how many versions fall outside the new setting, say so instead of implying
     the change is free.
   - Name, schedule and the notification address are not guarded. Asking about them spends the user's attention where
     nothing is at risk, which is its own defect.
4. **Summarize and confirm** before applying: what changes, from what, to what.
5. **Apply in place** with the update tool, then confirm it took effect by reading the plan back rather than by
   trusting the call's own answer.

**Never describe the plan as fully shown.** What this surface can read back is not everything a plan may carry: a plan
created outside it can hold a pre- or post-action that runs a command, and nothing here can report that — the only place
those parameter names appear is a refusal to accept them. So summarise what you changed and what you read, and do not
tell the user "this is your plan" as though the list were complete.

## When an in-place change is not possible

Some changes may not be expressible through an update. Then, in this order:

1. Say plainly what cannot be changed in place.
2. **Name what a rebuild would cost** - the plan's history and the association with data already backed up - and
   which parts survive. Never phrase it as "are you sure?".
   If the agent's version verdict is not a clear yes, the SAME prompt must say so, and the two negative cases are
   worded differently (`agent_version`, `agent_supported`, `agent_support_note` from health): *older than the baseline*
   → name both versions and that the cost you described was established against a different agent, the remedy being to
   update; *version could not be read* → say that and nothing about being out of range. Never say "unsupported" and
   never suggest changing or downgrading the agent — downgrading the agent that holds the backup data destroys data
   through wording alone. A positive verdict is not a review: it means only "not older than the oldest reviewed
   version".
3. Let the user decide. If they decline, leave the plan untouched and say what they still have.
4. Only on an explicit yes: create the replacement, verify it, and tell them what was lost, not just what was made.

If the backup tools aren't available yet (setup not finished), don't expose internals - say a quick one-time setup
is needed and run `/setup` first.
