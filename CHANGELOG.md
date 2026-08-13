# Changelog

> Versions here are the PLUGIN manifest, which is a different namespace from the server's release tags. A change
> is delivered by the version that carried it, which is not always the commit that wrote it - see 0.7.0.

## 0.9.0

- **The proxy no longer re-announces a tool list the client already has.** Measured on a real machine: an install
  stops and starts the service, each failed forward degrades the proxy to onboarding mode, and the 4-second re-probe
  promotes it straight back - so `notifications/tools/list_changed` fired repeatedly during exactly the operation the
  user was consenting to. Every call came back `tool permission not granted`, and the session named its own symptom:
  *"the connection is dropping out from under the permission grant before it can take effect"*. **No install ever
  completed through a session, while the same tool installed when driven directly.** A promotion after a blip
  advertises the SAME list, so the notification bought nothing and cost the client its state. The announcement now
  keys on what the client last RECEIVED, not on which mode the proxy is in.

## 0.8.5

- **The unshipped `license` command is now unmistakable to a scan**, not only to a reader. It has never been in
  `commands/` and was never loaded - but it kept a command's frontmatter, so a check that counted frontmatter rather
  than location read it as a ninth shipped command and another team investigated a `/license` that no user can reach.
  The extension is now `.md.frozen`; restoring it is a rename and a move.

## 0.8.4

- **`protecting-something-new`** - the frozen-family check is **step 0**, not a note inside the creation step. Shipped
  one version earlier in the right words and the wrong place: it said "say this before asking anything else" while
  sitting after the two steps that ask. Every step below it asks the user for something, so discovering the family at
  creation time means all of it was collected and then discarded.

## 0.8.3

- **`/new-plan`, `protecting-something-new`** - only FILE backup plans can be created on this surface today; the
  disk-image, SQL, Hyper-V and VMware families are frozen. Both now say so **before** gathering sources, schedule and
  retention, because collecting a plan's worth of decisions and then bouncing the call teaches the user that their
  answers here are provisional. Reported as unavailable - never as something the product cannot do, never as a
  failure, since nothing ran.

## 0.8.2

- **Checksum verification** moved into `proxy/verify-download.mjs` so the refusing branch can be FIRED. Verification on a
  real machine reached both "no checksum readable" refusals and found the comparison itself unreachable from outside: the expected digest comes from the same release object as the bytes, so making them disagree means
  controlling the release host. **That property is why the check is worth trusting, so it stays** - and a check nobody
  has seen fail is not a check, so the mechanism now lives where a test calls it with two values directly. No caller
  can supply the expected digest; behaviour is unchanged.

## 0.8.1

- **`/restore`** - restoring to a DISK or VOLUME is reported as unavailable instead of being prepared. The tool that
  does it is **frozen** on this surface: present in the product, switched off here. The published text walked the user
  through naming the disk and agreeing that its entire contents would be replaced - a confirmation collected for a
  call that would be refused. **A user who agrees to destroy a disk and then sees a refusal learns that confirmations
  here are theatre**, which is the reflex that gets a real one clicked through. The requirements are kept, marked as
  what the capability needs when it returns.
- **`/report`** - the misleading-name example names its tool as frozen today, so a reader who checks it and sees
  FROZEN does not conclude the rule is stale.

## 0.8.0

- **`/new-plan`, `/edit-plan`** (`get_plan`, `update_plan`, `create_file_backup_plan`) - the schedule is read BACK
  and reported, instead of being named as a blind spot. As of server `0.6.1` the plan read returns the plan's real
  recurrence from its definition on disk, plus the force-full twin when the plan declares one. Four published
  statements said this surface could not read a schedule back; each was measured and true when written, and each
  became false when the server shipped the read.
- **The two groups are now kept apart.** Retention, compression and exclusions still cannot be read back per plan and
  are still named as unconfirmed. Writing off the readable half with the unreadable one is how a fixed defect stays
  invisible - and the defect this read-back exists for was a plan asked to run every two days and recorded as
  MONTHLY.

## 0.7.3

- **`/new-plan`** - relays the creation result's own `PROTECTION IN EFFECT:` block instead of composing one from the
  request. The server publishes it as of 0.6.1, marking each value *(you asked)* or *(agent default)* - the exact
  distinction this section existed to preserve, now measured rather than reconstructed. **The published text said the
  result "carries no protection summary", which stopped being true when the server shipped it.** Composing is kept as
  the fallback for older servers, and must say that it is composed: a reconstruction that disagrees with the result is
  worse than either version alone, because two truths arrive in one message.

## 0.7.2

- **`protecting-something-new`** - the plan list is read BEFORE anything is asked, and for two things rather than
  one: whether the data is already protected, and whether the proposed name is free. The naming question used to
  come first, so a folder an existing plan already covers could be asked about and the answer then discarded. **A
  question whose answer gets thrown away is worse than no question** - the user made a decision and watched it
  evaporate, which teaches them that being asked here means nothing.

## 0.7.1

- **`/setup` manual fallback** - said the user could double-click "the same downloaded installer". After the
  routing change there is no such file: the tool downloads to a temporary path and removes it whether the run
  succeeded or failed, so that a verified installer does not sit on disk waiting to be run later by something that
  will not re-check it. The fallback now says to download it from the location the status names.

## 0.7.0

- **`/setup` and the `onboarding` skill** - both now route the install through `noname_install_server` instead of
  describing shell steps. The tool shipped in 0.6.0 and **nothing pointed at it**: the instructions still told the
  model to download and run the installer itself, so the default path stayed the improvised one the tool replaced -
  and that path cannot verify a checksum, so it runs an elevated installer on the strength of a URL. A capability no
  instruction names is not a capability.
- **Failure wording** - both now relay the STATE the machine is left in, not only what went wrong. A non-zero
  installer exit says it may be PARTLY installed, because "setup failed" implies the opposite and nobody hunts for a
  half-installed service they believe never existed. A checksum mismatch is never retried: corruption and
  substitution are indistinguishable from here.
- **Success wording** - a finished install may say setup is done and the tools are available; it may NOT say backups
  are working, protected or ready. Installing the service is not having an agent, a destination or a plan.
- **The silent switches suppress the INSTALLER's dialogs, not the Windows approval prompt** - now stated in the
  proxy, the skill and the command, because the switch names invite the opposite reading. That prompt is the one
  gate in this flow that is not ours.
- **`protecting-something-new`** - proposes a plan NAME (below). **Written one commit earlier, in a commit that
  moved no version, so it reached nobody until this release carried it.** Recorded here rather than under its own
  heading because the version is the delivery mechanism: `plugin update` compares numbers, not commits.

- **`protecting-something-new`** - proposes a plan NAME from the user's own words for the data and asks through the
  client's question interface before creating anything. Uniqueness is a hard requirement, not tidiness: the plan-reading
  tool refuses a name that several plans share, so a duplicate removes the by-name route to that plan for every later
  read. A collision is resolved with the user's words, never by appending a number. If they decline, the plan is still
  created with the proposal and the result says what it was called - a name is never applied SILENTLY, which is not the
  same as never applied.

## 0.6.0

- **`noname_install_server`** (new) - the one-time setup as a TOOL in the proxy, so it works on a client with no shell.
  Requires explicit consent, reads the checksum published with the release, and compares it **before** executing.
  Refuses - never skips - when no checksum can be read, because a check that finds no hash looks exactly like a check
  that passed. A mismatch deletes the file, does not run it, and is never retried automatically: this surface cannot
  tell a corrupted download from a substituted one.

  **It changed nothing for any user until 0.7.0**, which is the release that pointed the instructions at it.

## 0.5.0

- **`noname_setup`** — when the backup tools do not appear after setup, the guidance now asks for a **full quit and
  reopen**, naming the tray icon, instead of saying "restart". Measured on a real machine: on a client that minimises to
  the tray, closing the window hides it while the process keeps running, so "restart" is a motion the user can perform
  with no effect — and they conclude the product is broken. Same wording in the setup command and the onboarding skill.

## 0.4.0

- **`protecting-something-new`** — added `when_to_use` carrying the RISK register ("not protected yet", "could not
  afford to lose"). Trigger measurement went from 0 of 3 to 4 of 5. The description had only imperatives; the register
  had been carried by the skill's human-readable name until 0.3.0 renamed it.

## 0.3.0

- **All skills** — frontmatter `name` is now a slug equal to its directory. In a plugin skill the `name` replaces the
  directory name in the command, so a display title would have produced an untypeable command.
- **`onboarding`** — description leads with the phrases a new user types and names the rules it carries (never install
  the agent silently, never shell-probe, a leftover data folder is not proof of an install).

## 0.2.0

- **Proxy startup probe** — liveness is asked of `/mcp` instead of `/health`. Measured: `/health` costs ~3.1 s because
  it aggregates agent state, against a 2500 ms per-attempt ceiling, so a healthy server was declared **absent on 100% of
  starts** — worst on the machines where the product is installed and working.
- **Proxy compat check** — a floor (default major 0) instead of an exact major match. The old form told users to update
  the server to a version that does not exist.
- **`noname_setup`** — answered by the proxy itself in forward mode instead of being forwarded to a server that never
  had it, which returned `-32602 Unknown tool` naming a tool the proxy had advertised.
- **Licence command** — unshipped; its whole tool family is frozen, so it advertised a capability the dispatcher
  refuses. Moved rather than deleted, so restoring it is one move.
- **Update path** — the manifest version now moves with every published change. Without that, `plugin update` compares
  an unchanged version, reports "already at the latest version", and the fix reaches nobody who already installed.

## 0.1.0

- Initial release: nine commands, the onboarding skill, and the stdio proxy.
