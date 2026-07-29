---
name: destinations
description: List, add, and test backup storage destinations (local, Wasabi, Amazon S3, Backblaze).
---

# /destinations - manage storage destinations

Help the user view or set up backup destinations. Promoted storage tools: `list_storage_accounts`, `add_storage_account`. To test a connection (not in the promoted set), use the meta-tools (`search_tools` -> `execute_tool`).

- **List:** show configured destinations (type, name, status).
- **Add:** gather the destination type (local, Wasabi, Amazon S3, Backblaze) and its credentials/path, create it, then **test the connection** and report pass/fail.
- **Test:** validate an existing destination's connection.

Treat credentials as sensitive - never echo secrets back. If the backup agent is absent, run `/setup` first.

**Removing a destination** is not in the promoted set (reach it via the meta-tools) and it is destructive: confirm
first with the loss NAMED — the destination and the credentials stored for it are gone, and any plan pointing at it
stops working. Never phrase that as "are you sure?".

**Say what CLASS of thing dies, because the two are easy to confuse.** What this removes is the destination's
configuration and its stored credentials ON THIS MACHINE, and with them the ability to list or restore from it here.
Whether anything at the destination itself is deleted is **not established by anything we have measured** — so do not
claim it is safe and do not claim it is destroyed. Say plainly that you cannot tell them, and that if it matters they
should check in the storage provider before agreeing. A user who thinks they are tidying a list, or who thinks their
cloud copies are being erased, is being misled in opposite directions by the same silence.

Never quote a credential back — not in the confirmation, not in a log line, not in an error. A confirmation that names
what will be lost is exactly where a secret gets echoed by accident. The same applies to anything that REPLACES configuration
wholesale (a template or settings import): say which destinations and credentials disappear, and remember that
having exported first does not make it reversible when the export itself carries only part of the configuration.

Two cautions that apply to every destructive step here, not only to removal:

- **Neither a tool's NAME nor its description is a guard.** Two import tools reach the same configuration-replacing
  call and only one is marked destructive, the unmarked one reading as additive — and a tool this product ships
  performs a shrink under a name that reads like a read. Before invoking a long-tail tool you have not used here, read
  what it does (`get_tool_info`) and decide from that. A name that sounds like a read is given none of the caution a
  verb that sounds like it acts, which is exactly what makes a misnamed mutation dangerous.
- **If the agent's version verdict is not a clear yes, name it in the confirmation itself** (`agent_version`,
  `agent_supported`, `agent_support_note` from health), and word the two negative cases differently: *older than the
  baseline* → name both versions, the remedy is the user's and it is to update; *version could not be read* → say that,
  and do not call the agent out of range, because an unknown stated as a finding is false about their machine.
  Never say "unsupported" and never suggest changing or downgrading the agent: a downgrade of the agent holding the
  backup data destroys data through wording alone. And a positive verdict is not a review — it means only "not older
  than the oldest reviewed version".
