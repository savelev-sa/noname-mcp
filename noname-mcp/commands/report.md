---
name: report
description: Report backed-up data volume per plan/session and occupied space per destination.
---

# /report - capacity & data reporting

Report data figures. The reporting tools (backed-up volume per plan/session; occupied space per destination) are not in the promoted set - find and call them via the meta-tools (`search_tools` -> `get_tool_info` -> `execute_tool`).

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.

- Backed-up volume: per plan and/or per session.
- Occupied space: per destination/storage account.

Note the channel constraint: volume figures may come from non-CLI channels (settings XML / read-only SQLite), so some of them can be unavailable on a given machine - say so plainly rather than guessing. If the agent is absent, run `/setup` first.
