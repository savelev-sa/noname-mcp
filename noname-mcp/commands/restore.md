---
name: restore
description: Guided restore - browse restore points, pick a version, restore to a target, verify.
---

# /restore - restore backed-up data

Guide the user through a restore. Promoted restore tools: `list_restore_points` (browse versions) and `quick_restore` (latest). For a point-in-time restore to a chosen target (not in the promoted set), find and call the restore tool via the meta-tools (`search_tools` -> `execute_tool`).

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.

1. Identify the plan / backed-up data and **browse available restore points** (versions).
2. Let the user pick a version and a restore target location.
3. **Show a summary and require explicit user confirmation before restoring — and NAME what will be lost**, never "are you sure?": the target location, that files already there will be REPLACED by the chosen version, and which version that is. If you cannot tell what the target already contains, say so plainly and offer an empty folder as the target instead.
   - **If the agent's version verdict is not a clear yes, say so IN THIS PROMPT** — nobody reads a health field while
     confirming a restore, so mentioning it anywhere else does not count. Read `agent_supported`, `agent_support_note`
     and `agent_version` from health, and word the two negative cases DIFFERENTLY, because the remedy differs:
     - the note says the installed agent is **older** than the baseline → name the installed version and the baseline,
       and that what you just described as "will be lost" was established against a different agent. The remedy is the
       user's: update the agent;
     - the note says the version **could not be read or parsed** → say exactly that. Do NOT describe the agent as out
       of range: an unknown presented as a finding is a false statement about their machine.
   - **Never use the word "unsupported", and never suggest changing or downgrading the agent.** A user told their
     backup agent is unsupported may downgrade it — and downgrading the agent that holds the backup data destroys data
     through wording alone.
   - A positive verdict is not a review. It means only "not older than the oldest reviewed version": an agent newer
     than anything ever reviewed reports exactly like a reviewed one, so never present it as "verified against your
     agent" and never claim it was checked.
4. After restore, verify the restored content matches the chosen version and report.

If the agent is absent, run `/setup` first.
