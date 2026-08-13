---
name: restore
description: Guided restore - browse restore points, pick a version, restore to a target, verify.
---

# /restore - restore backed-up data

Guide the user through a restore. Promoted restore tools: `list_restore_points` (browse versions) and `quick_restore` (latest). For a point-in-time restore to a chosen target (not in the promoted set), find and call the restore tool via the meta-tools (`search_tools` -> `execute_tool`).

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.

**And read that answer for the TARGET, never for the door you go through.** The meta-tool that runs long-tail tools is
itself reported as destructive — correctly, since it can reach every destructive tool there is — but that marking
describes the FORWARD, not your call. It tells you nothing about whether the tool you named will destroy anything, and
its own confirmation is deferred to the target's. So: never read the door's marking as "this call is gated", and never
read it as noise either. Ask the target what it does, and confirm on that answer.

**Never withhold a restore on licence grounds, and never announce that one is unavailable because of a licence.** The
agent's own table does not gate restore by plan type, so a licence state — expired, unactivated, unreadable — is not
evidence that recovery is out of reach. Attempt the restore and report what the agent actually answers. The asymmetry
decides this, not caution: attempting one that turns out to be refused costs a failed command, while discouraging one
that would have worked costs the data, at the only moment this product exists for.

**And do not try to establish WHICH licence state it is beforehand — the local state carries no expiry date**, so a
never-activated licence and a lapsed one are indistinguishable up front. Saying "your licence has expired" is therefore
an assertion about something not readable from here. Say the state is not determinable, attempt the operation, and name
what the agent refused with only after it has refused.

**The concrete harm of guessing that word, since it is not obvious:** a licence can be perfectly valid and merely not
activated on THIS machine. Telling that user their licence expired sends them to renew a subscription they already
have — money spent, and the actual problem, activation, still there when they come back. "Blocked" and "expired" are
two different statements and only the first is ever observable here.

1. Identify the plan / backed-up data and **browse available restore points** (versions).
2. Let the user pick a version and a restore target location.
   - **Restoring to a DISK or VOLUME is not available through this surface right now — say so, do not prepare it.**
     The product has a disk-image restore that takes a target such as `\\.\PhysicalDrive1` or `D:`, and this surface
     answers that tool as **frozen**: the capability exists and is switched off. So if the user asks for a bare-metal
     or disk-image restore, tell them it is not available here — **never that there is no such thing**, which is a lie
     about the product, and never "it failed", because nothing ran.
   - **Do not walk them through the decision first.** Composing the warning, naming the disk and collecting a
     confirmation for a call that will be refused spends the most expensive kind of attention on nothing — and a user
     who agrees to destroy a disk and then sees a refusal learns that confirmations here are theatre. Establish that
     the route exists before asking anyone to agree to its consequences.
   - **When it becomes available, this is what it needs, and none of it is optional:** restoring to a disk or volume
     replaces EVERYTHING on it, not only files that happen to collide; the target is resolved ONLY from an id the user
     supplied explicitly — never inferred, never a "probably this one", never carried over from an earlier step; and
     naming it is this command's job, because the tool's own confirmation does not say which disk.
   - **Restoring FILES is unaffected and is the path that works:** `restore_files` takes a destination FOLDER, so a
     drive letter given there restores files INTO it and does not replace it.
   - **When the server does refuse with its own sentence, quote that sentence — do not compose a rival one.** A
     refusal here arrives as `This will <what>`, written by the code that performs the operation. Pass it through in
     those words and add what it cannot know, such as which disk. Restating the same cost in your own phrasing tells
     the user the price twice in two voices, and the two will drift apart the moment either side is edited.
   - **Do not read that refusal as coverage.** Only a small minority of this product's tools emit it at all — a
     destructive tool nobody wrote a rule for is refused by nothing. For everything reached through the meta-tools,
     your confirmation is the only one the user will ever see.
   - **Omitting the destination is not the neutral choice.** The quick-restore path restores to the ORIGINAL location
     when no destination is given — that is restoring over the user's current files. Never leave it out to keep a call
     simple; choose it deliberately or not at all, and if it is chosen, that IS the overwrite the confirmation must name.
   - **A chosen destination does not receive the files bare.** The file-restore path recreates the full source path
     inside it, so `C:\Data` restored to `D:\Restore` lands at `D:\Restore\C\Data`. Say where the files will actually
     appear, because a user who agreed to "restore to D:\Restore" and finds an empty-looking folder concludes the
     restore failed.
3. **Show a summary and require explicit user confirmation before restoring — and NAME what will be lost**, never "are you sure?": the target location, that files already there will be REPLACED by the chosen version, and which version that is. If you cannot tell what the target already contains, say so plainly and offer an empty folder as the target instead.
   - **Unless the agent's version state is `Reviewed`, say so IN THIS PROMPT** — nobody reads a health field while
     confirming a restore, so mentioning it anywhere else does not count. Read `agentSupportState`,
     `agentSupportNote` and `agentVersion` from health. The four states are worded DIFFERENTLY because the remedy
     differs, and one of them has no user remedy at all:
     - `Reviewed` — the only state that may be presented as checked against this machine. Say nothing extra.
     - `OlderThanReviewedRange` — name the installed version and the oldest reviewed one, and say that what you just
       described as "will be lost" was established against a different agent. The remedy is the user's: update.
     - `NewerThanAnythingReviewed` — name the installed version and the newest REVIEWED one, say nothing is known to be
       wrong, and that closing the gap is our work rather than theirs. **Never call it unsupported and never invite them
       to change the agent.** This is the state a blameless user meets by letting the vendor ship.
     - `CannotBeDetermined` — say the version could not be read. Do NOT describe the agent as out of range, and do not
       withhold anything on the strength of it: an unknown presented as a finding is a false statement about their
       machine, and refusing on it charges them for our own failed read.
   - **Never use the word "unsupported", and never suggest changing or downgrading the agent** in any state. A user
     told their backup agent is unsupported may downgrade it — and downgrading the agent that holds the backup data
     destroys data through wording alone.
4. After restore, verify the restored content matches the chosen version and report.

If the agent is absent, run `/setup` first.
