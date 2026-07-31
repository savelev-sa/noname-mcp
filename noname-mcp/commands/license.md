---
name: license
description: Assign a license and report active license types and counts.
---

# /license - license management

Help the user with licensing. The license tools are not in the promoted set - find and call them via the meta-tools (`search_tools` -> `execute_tool`).

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.

- **Report:** active license types and counts — **and report the state as UNKNOWN rather than asserting one.** Measured:
  the local licence state carries **no expiry date**, so a never-activated licence and a lapsed one are indistinguishable
  from here. "Your licence has expired" is therefore an assertion about something this surface cannot read, and it can be
  wrong in the ordinary case where a licence is perfectly valid and merely not activated on THIS machine. What you may
  name is a refusal the agent actually returned: its codes distinguish *no active licence* from *expired*, and that came
  from the agent rather than from you.
- **A licence problem NEVER discourages a restore, and never gets mentioned as a reason one is unavailable.** Measured:
  the vendor's own plan-type table does not gate restore, so no licence state is evidence that recovery is out of reach.
  **The asymmetry decides it and is worth carrying in your head:** wrongly attempting a restore costs one failed command;
  wrongly discouraging one costs the backup this product exists to provide. There is no version of this where the
  cautious-sounding answer is the safe one — and the person hearing it has usually just lost a disk.
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
