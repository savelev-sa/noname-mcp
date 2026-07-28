---
name: restore
description: Guided restore - browse restore points, pick a version, restore to a target, verify.
---

# /restore - restore backed-up data

Guide the user through a restore. Promoted restore tools: `list_restore_points` (browse versions) and `quick_restore` (latest). For a point-in-time restore to a chosen target (not in the promoted set), find and call the restore tool via the meta-tools (`search_tools` -> `execute_tool`).

1. Identify the plan / backed-up data and **browse available restore points** (versions).
2. Let the user pick a version and a restore target location.
3. **Show a summary and require explicit user confirmation before restoring — and NAME what will be lost**, never "are you sure?": the target location, that files already there will be REPLACED by the chosen version, and which version that is. If you cannot tell what the target already contains, say so plainly and offer an empty folder as the target instead.
4. After restore, verify the restored content matches the chosen version and report.

If the agent is absent, run `/setup` first.
