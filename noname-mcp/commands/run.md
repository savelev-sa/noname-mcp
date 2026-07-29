---
name: run
description: Run a backup plan on demand (incremental, full, or differential; transaction-log for SQL plans).
---

# /run - run a plan now

Start a backup plan immediately, regardless of its schedule. Promoted tools: `list_plans` to find the plan, `run_plan` to start it (its `mode` is incremental by default, or full / differential), `stop_plan` to stop one that is running. Transaction-log and SQL-specific differential runs are not promoted - reach them via the meta-tools (`search_tools` -> `execute_tool`).

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.

1. Identify the target plan (list plans if the user is unsure).
2. Confirm the mode: incremental (default), full, or differential — transaction-log applies to SQL plans only.
3. **Confirm with the user before starting** the run.
4. Report that a session started and how to check it (`/status`).

If the agent is absent, run `/setup` first.
