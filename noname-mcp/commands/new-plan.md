---
name: new-plan
description: Guided creation and scheduling of a file backup plan (sources, destination, encryption, compression, retention, failure alerts).
---

# /new-plan - create a file backup plan

Walk the user through creating and scheduling a file backup plan, using the plan-creation tools (e.g. `create_file_backup_plan`). Talk to the user in plain, non-technical language — describe choices in words, not tool or field tokens.

Gather, confirming each: sources (folders), destination (an existing one from `/destinations`), schedule, encryption, compression, retention, and whether the plan should raise a failure alert (a yes/no/only-on-failure choice, NOT an address). Then **show a summary and ask the user to confirm before creating** the plan.

**A plan cannot choose WHO is alerted — only WHETHER.** The plan's own notification setting is a three-value choice
(on failure only / on / off) and nothing else: there is no per-plan recipient. **Who receives the mail is a
machine-wide setting shared by every plan on that machine.** So never ask the user for "the address for this plan" and
never accept one — a per-plan address promises routing that does not exist. If the user wants alerts: set the plan's
choice, then READ BACK the machine-wide recipient and tell them who will actually be told.

**Why this one is worth the extra sentence.** A user who believes each plan mails its own owner gets mail that all goes
to one address, and **nothing reports the substitution**. An alert is bought so somebody learns about a failure without
looking — so a misrouted one is discovered by *not hearing about an incident*, which from the inside is
indistinguishable from everything being fine.

**And changing that machine-wide address changes it for every plan**, including ones this user did not create and may
not know about. Say so before changing it, take it verbatim from the user, never infer one from an account name or a
licence record, and never offer a "probably this one" — a plausible wrong address quietly sends this user's backup
reports, including what they back up and when it fails, to a stranger.

The same applies harder to testing it: sending a test message is not an inspection. It sends real mail through the
user's own SMTP account, appearing to come from them, to whichever address is named — and the tool accepts an address
the CALLER supplies rather than only the saved one. Ask before sending, name the recipient in the asking, and never
send to an address the user did not give you. Nothing here can recall a message once it has gone.

**And omitting the recipient is not the cautious version of that call.** With no address given, the tool uses the
address already saved in the settings — so a call meant as a connectivity check still mails whoever is configured,
which may be a person who did not expect it and cannot tell it from a real alert. There is no way to exercise this
without sending: treat every form of it as sending, and ask first.

**Encryption is not a checkbox in that list — it is a password the user must still have years from now.** The agent's
restore path takes the encryption password as an input (`-ep`), so the password is required at the moment the data is
wanted, not only when the plan is made. Nothing in this product's captured command surface recovers, resets or hints a
forgotten one. So if encryption is chosen: say in plain words that the backup cannot be read back without that
password, ask where the user will keep it, and never generate one for them or store it anywhere in this conversation.
Encrypting a backup whose password is then lost produces the one outcome a backup exists to prevent, and it does it
silently — the plan keeps reporting success.

**Retention deserves a sentence of its own, not a slot in the summary.** It is the one setting here that decides a future
deletion: whatever it says will be applied later by unattended runs, with nobody present to ask. So state in plain words
what the plan will keep and what it will stop keeping, and let the user agree to that rather than to a number. The other
settings are reversible by editing the plan; versions already removed under a retention rule are not.

**Saying nothing about retention does not mean nothing gets deleted.** A plan created without a retention setting takes
the agent's own default, and that default deletes: measured on a created plan's stored definition, no retention flag
records "use default settings" with a **90-day** period. So "we did not set a retention rule" and "nothing will be
removed" are different statements, and only the first is true. Never report the absence of a choice as the absence of a
consequence — name the default and let the user accept it deliberately, exactly as you would a value they picked.

**And "retention" is not one setting — which controls exist depends on the plan's backup format, and the two sets do
not overlap.** Keeping a limited number of versions and *always keep the last version* are both documented as **not
compatible with the new backup format**; the generational and forever-forward controls belong to the new format
instead. So do not offer a retention scheme before establishing which format the plan uses, and never describe a
control as available because it exists in the product.

**Two things to say plainly when retention comes up, neither of them reassuring:**
- **One narrow reassurance you MAY give, in its own terms and no wider.** The purge control — the one that removes data
  whose retention period has expired — is documented as acting *"except current generation or latest object version"*,
  and it names both formats. So expiry-driven purging is not the path that takes a user's most recent copy. Say that if
  it is asked, because withholding it is its own kind of misleading.
- **It is not a general guarantee, and the difference is the part to keep straight.** *Always keep the last version* is
  a separate control with a yes/no value, which would have nothing to do if the last copy were unconditionally safe — so
  a legacy plan never told to keep it was not promised it by that flag. Purge sparing the latest version says nothing
  about version limits, a deleted plan, a removed destination, or the locally-deleted-file expiry below. Point at the
  control that protects the copy, never at the product.
- **One retention control expires a backup copy because the file was deleted LOCALLY**, some days afterwards. The act
  that triggers it — tidying a folder — is the very thing that later makes someone need the backup, and nobody connects
  the two. If that control is ever set or read, name it in those terms rather than as a number of days.

**These settings are not independently choosable, and the summary you show must not imply they are.** Two kinds of
constraint apply, and both are stated in the agent's own help:

- **Which side of the format fork a setting lives on.** Purge-by-default, purge delay and the force-full schedule are
  documented as *not compatible with the new backup format*; the generational (GFS) controls and forever-forward
  incremental exist only on the new side. So a plan cannot have a force-full schedule and generational retention — not
  because one is a bad idea, but because they are on opposite sides of a choice made once.
- **Pairs that exclude each other on the SAME side.** Generational retention is documented as not compatible with a
  forever-forward incremental schedule, so offering both is offering a combination the agent will refuse.

Practical rule: gather what the user wants, then establish the plan's format, then say which of their wishes are
available together — in that order. Confirming a set of settings the agent will reject wastes the user's decision and
teaches them that the confirmation was not worth reading.

**Report the protection actually in effect, not merely that a plan was created — and that includes what nobody chose.**
Three defaults of the **file** backup plan narrow it silently, and each one surfaces at the restore, the single moment a
user cannot absorb it. Unless the plan was created asking otherwise, say plainly:

- **NTFS permissions are not backed up.** A restore returns the files without their access control.
- **System and hidden files are excluded.** This one inverts the usual reading — the default here is to EXCLUDE, so
  leaving the option alone is what leaves the files out.
- **EFS-encrypted files are not preserved as encrypted.** Say that and stop: what the agent does with such a file
  under this default — stores it decrypted, or skips it — is not established here, and the two deserve different
  sentences. The option to keep them encrypted applies only to plans using the new backup format, so it is not simply
  available on request — and read the next paragraph before offering to change that.

**The backup format is a one-way door, and two of the options above lead to it.** The agent's own help says it in as
many words: once a plan's format is changed from current to new, *the return to the current format will not be
possible*. So never switch the format in order to satisfy a request for an option that requires it — keeping EFS files
encrypted, or synthetic full backups — without saying first, in the same breath, that the change is permanent and that
the user is agreeing to the format and not just to the option. The trade is real in both directions: block-level backup
is **not compatible** with the new format, so a plan gaining one capability can lose another, and synthetic full is
additionally **not supported by all storage providers**. Never present the format as a detail of a feature request.

"Back up my documents" is a request about the documents, not about flags. A user who is never told what was left out
learns it years later, from a restore that returns less than they believed they had.

**Do not carry any of this to another plan family.** These three were read from the file-plan verb, and the plan
families are **not symmetric** — the option for keeping encrypted files encrypted has been reported absent from the
image-plan help entirely, not merely defaulted differently. So for a disk-image or any non-file plan, none of the three
sentences above is established: read that family's own options before saying anything about what it protects. A default
measured on one verb is a fact about that verb.

**After creation, read the plan back and compare it with what the user asked for** — do not report success from the
creation call's own answer. Check specifically the settings that decide what "backed up" MEANS: retention, compression,
and any exclusions. Whether a created plan actually carries them is not verifiable from what we send, and retention is
the one most likely to be silently wrong while everything reports fine — the user would discover it at a restore, when
it decides how far back they can reach. If a setting disagrees with what was asked, or cannot be read back at all, say
that instead of confirming; an unconfirmable setting is not a saved one.

After that, confirm the plan was saved. If the backup tools aren't available yet (setup not finished), don't expose internals — just tell the user a quick one-time setup is needed and run `/setup` first.

**Changing a plan that already exists: EDIT it, never delete and re-create.** There is no `/edit-plan` command, but
the capability exists — find the plan-update tool through the meta-tools (`search_tools` -> `execute_tool`) and use

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.
it. This matters because delete-and-recreate looks equivalent and is not: it discards the plan's identity, its
session history and the backup data associated with it. If a user asks for a change you cannot make through an
update, say what would be lost before offering to rebuild the plan, and let them decide — the loss is theirs to
accept, not yours to spend on convenience.
