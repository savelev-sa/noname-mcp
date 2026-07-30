---
name: restore
description: Guided restore - browse restore points, pick a version, restore to a target, verify.
---

# /restore - restore backed-up data

Guide the user through a restore. Promoted restore tools: `list_restore_points` (browse versions) and `quick_restore` (latest). For a point-in-time restore to a chosen target (not in the promoted set), find and call the restore tool via the meta-tools (`search_tools` -> `execute_tool`).

**Before invoking a long-tail tool you have not used here, read what it DOES (`get_tool_info`).** A tool's name is not evidence: this product ships one that performs a shrink under a name that reads like a read. A reading name is given none of the caution a verb that sounds like it acts.

**Never withhold a restore on licence grounds, and never announce that one is unavailable because of a licence.** The
agent's own table does not gate restore by plan type, so a licence state — expired, unactivated, unreadable — is not
evidence that recovery is out of reach. Attempt the restore and report what the agent actually answers. The asymmetry
decides this, not caution: attempting one that turns out to be refused costs a failed command, while discouraging one
that would have worked costs the data, at the only moment this product exists for.

1. Identify the plan / backed-up data and **browse available restore points** (versions).
2. Let the user pick a version and a restore target location.
   - **A disk or volume target is a different magnitude from a folder, and this product accepts one.** The disk-image
     restore tool takes a target such as `\\.\PhysicalDrive1` or `D:` — and restoring there replaces EVERYTHING on that
     disk or volume, not only files that happen to collide. Treat it as its own decision: name the disk or volume the
     way the machine identifies it, say plainly that its entire contents are replaced, and resolve it ONLY from an id
     the user supplied explicitly. Never infer it, never offer a "probably this one", and never carry it over from an
     earlier step in the conversation.
   - The tool's own confirmation fires, but it does not name which disk — so the naming is this command's job, not
     something the gate has already done for you.
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
