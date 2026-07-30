---
name: destinations
description: List, add, and test backup storage destinations (local, Wasabi, Amazon S3, Backblaze).
---

# /destinations - manage storage destinations

Help the user view or set up backup destinations. Promoted storage tools: `list_storage_accounts`, `add_storage_account`. To test a connection (not in the promoted set), use the meta-tools (`search_tools` -> `execute_tool`).

- **List:** show configured destinations (type, name, status).
- **Add:** gather the destination type (local, Wasabi, Amazon S3, Backblaze) and its credentials/path, create it, then **test the connection** and report pass/fail.
- **Test:** validate an existing destination's connection.
- **Edit an existing destination only when the user asked for that**, and say what it can break before doing it: plans
  reach their destination THROUGH the account, so changing its settings can leave existing plans pointing at something
  that no longer answers — and **none of those plans reports a change**. The failure appears at the next scheduled run,
  or at a restore. After any edit, test the connection and say which plans use this destination, or say plainly that you
  could not determine that.

Treat credentials as sensitive - never echo secrets back. If the backup agent is absent, run `/setup` first.

**Two Amazon S3 settings decide things nobody discovers until the restore, so name them when the destination is set up
and never leave them to a default.** Both are documented as applying to Amazon S3 storage only, so do not offer either
for another provider.

- **Storage class is a recovery-time decision wearing a price tag.** The accepted values include `Glacier`,
  `GlacierInstantRetrieval` and `GlacierDeepArchive` alongside `Standard`. An archival class means a restore that takes
  **hours and costs money to retrieve**, and nothing about the plan, the destination or a successful backup looks any
  different until somebody needs the data. If a user is choosing on price, say what the cheap answer costs at the moment
  it is used.
- **Server-side encryption is off unless asked for** — its documented default is `no`. So data at rest at the
  destination is unencrypted by default, which is a different question from the plan's own encryption password and needs
  asking separately.

The general rule these two are instances of: **anything a user would only find out at the restore must be said at
setup.** "Visible if it goes wrong" describes a failure, not a setting — a mistyped bucket is visible, a recovery that
takes six hours is not.

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

**And the export is not a free precaution either.** It writes to an absolute path you supply and replaces whatever is
already there — it declares itself read-only, which is wrong under the criterion above, because it cannot put back a file
it overwrote. So choose a path that does not exist yet, say which path you are writing to, and never suggest exporting as
the safe step without doing both.

Two cautions that apply to every destructive step here, not only to removal:

- **Neither a tool's NAME nor its description is a guard.** Two import tools reach the same configuration-replacing
  call and only one is marked destructive, the unmarked one reading as additive — and a tool this product ships
  performs a shrink under a name that reads like a read. Before invoking a long-tail tool you have not used here, read
  what it does (`get_tool_info`) and decide from that. A name that sounds like a read is given none of the caution a
  verb that sounds like it acts, which is exactly what makes a misnamed mutation dangerous.
- **Unless `agentSupportState` is `Reviewed`, name it in the confirmation itself** (with `agentVersion` and
  `agentSupportNote` from health), worded per state because the remedies differ: `OlderThanReviewedRange` → name both
  versions, the remedy is the user's and it is to update; `NewerThanAnythingReviewed` → name the installed and the newest
  reviewed version, say nothing is known to be wrong and that closing the gap is ours, never call it unsupported and
  never invite a change; `CannotBeDetermined` → say the version could not be read, do not call the agent out of range,
  and do not withhold anything on it. Never say "unsupported" in any state and never suggest downgrading the agent: a
  downgrade of the agent holding the backup data destroys data through wording alone.
