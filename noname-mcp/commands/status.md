---
name: status
description: Report the last session result and recent failures for a plan or all plans.
---

# /status - plan health

Report backup health. Use the promoted status tools (`get_plans_summary`, `get_plan_progress`, `get_history`).

- For a named plan: its last session result (success / failed / in-progress) with timestamp.
- For "all" / no plan named: a summary across plans, highlighting recent failures.

Keep it scannable (a short table). If the agent is absent, run `/setup` first.
