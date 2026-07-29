---
name: restore
description: Guided restore - browse restore points, pick a version, restore to a target, verify.
---

# /restore - restore backed-up data

Guide the user through a restore. Promoted restore tools: `list_restore_points` (browse versions) and `quick_restore` (latest). For a point-in-time restore to a chosen target (not in the promoted set), find and call the restore tool via the meta-tools (`search_tools` -> `execute_tool`).

1. Identify the plan / backed-up data and **browse available restore points** (versions).
2. Let the user pick a version and a restore target location.
3. **Show a summary and require explicit user confirmation before restoring — and NAME what will be lost**, never "are you sure?": the target location, that files already there will be REPLACED by the chosen version, and which version that is. If you cannot tell what the target already contains, say so plainly and offer an empty folder as the target instead.
   - **If the installed agent is outside the range this server build supports, say so IN THIS PROMPT.** Read
     `agent_supported` / `agent_support_note` / `agent_version` from health; when the answer is not a clear yes, the
     confirmation must name the installed version, the baseline it is compared against, and that what you just
     described as "will be lost" was established against a different agent. Nobody reads a health field while
     confirming a restore, so mentioning it anywhere else does not count.
   - Never present that verdict as "verified against your agent". It is a MINIMUM baseline: a true answer means only
     "not older than the oldest reviewed version", and an agent newer than anything reviewed reads the same as one
     reviewed and found fine.
4. After restore, verify the restored content matches the chosen version and report.

If the agent is absent, run `/setup` first.
