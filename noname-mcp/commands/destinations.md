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
stops working. Never phrase that as "are you sure?". The same applies to anything that REPLACES configuration
wholesale (a template or settings import): say which destinations and credentials disappear, and remember that
having exported first does not make it reversible when the export itself carries only part of the configuration.
