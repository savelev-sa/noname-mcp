---
name: failure-alerts
description: Use when the user asks about backup notifications - "email me if a backup fails", "who gets notified", "turn on success emails", "stop these alerts". Covers the machine-wide recipient, the per-plan trigger, and what testing the mail path does and does not prove.
version: 0.1.0
---

# Failure alerts

**Voice:** the user is a backup admin. Say "who gets the email" and "which plans send it" — never field names.

**Why this needs a skill: the surface splits this across two levels in a way nobody would guess, and the natural attempt
— set a recipient on the plan — is exactly what the tools appear to offer and do not.**

## 1. The RECIPIENT is machine-wide

`get_notification_settings` reads it. `update_notification_settings` sets it — **for every plan on this machine**,
including plans this user never created.

**Say that before changing it.** Redirect this wrongly and every future failure report goes to a stranger instead of to
them, silently, until someone notices the alerts stopped arriving.

## 2. The TRIGGER is per-plan

`update_plan` with the notification setting: **on | errorOnly | off**.

> **`on` means EVERY backup. That is the only route to a success alert. THERE IS NO SUCCESS-ONLY OPTION.**

Promising one is a promise this surface cannot keep. If the user wants "tell me when it works", the honest answer is
that they will get mail on every run, or none — and let them choose knowing that.

## 3. Testing the mail path proves less than it looks like

`test_smtp_connection` sends **real mail** to the **saved** recipient.

It proves the mail path works. **It does NOT prove a trigger is armed** — those are different levels, and this is exactly
where the two-level split misleads. A green test with every plan set to `off` means nobody will ever be told anything.

## 4. Nothing here reads back whether a trigger is armed

So **report what was set, and do not report that alerting works.** Those are different sentences and only the first is
supportable from this surface.

## Guard expectations

**`test_smtp_connection` is guarded — it sends data off the machine.**

**The recipient cannot be chosen at call time, by design.** A configuration test that mails somewhere other than the
configured address proves less about the configuration while adding a relay that an attacker could name. If a user wants
the test to reach a different address, the address gets changed first — deliberately, machine-wide, with step 1's warning
said out loud.

## Tools

`get_notification_settings`, `update_notification_settings`, `update_plan`, `test_smtp_connection`.
