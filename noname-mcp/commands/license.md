---
name: license
description: Assign a license and report active license types and counts.
---

# /license - license management

Help the user with licensing. The license tools are not in the promoted set - find and call them via the meta-tools (`search_tools` -> `execute_tool`).

- **Report:** active license types and counts.
- **Assign / activate:** confirm BEFORE applying, and name what cannot be undone — this product cannot put the
  licensing state back on its own. Reversing an activation needs a licence key the product does not hold and must not
  store, so the user has to supply one again. Say that, not "are you sure?".
  The test to apply if you meet an unfamiliar licensing operation: **can this product, using only what it already
  holds, restore the state this replaces?** If not, it gets a confirmation naming the loss — even when nothing is
  deleted. An operation can destroy nothing and still be impossible for us to undo.
  Two cautions measured rather than assumed: `activate_license` carries no destructive marking in the server today, so
  no gate will stop you — the confirmation is yours to make. And releasing a licence has been observed to deactivate a
  licensed installation, so treat any deactivation as the heavier of the two directions.

If the agent is absent, run `/setup` first.
