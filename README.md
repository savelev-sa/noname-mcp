# noname-mcp

Manage Windows backups from Claude Code: create and schedule backup plans, run them on demand, check plan health,
restore files, manage storage destinations and licenses — by talking to a backup agent installed on the same
machine. Windows only. Apache-2.0.

The repo is both the plugin and its marketplace: `.claude-plugin/marketplace.json` lists one plugin, `noname-mcp/`.

| Path | What it is |
|---|---|
| `.claude-plugin/marketplace.json` | marketplace manifest (a Claude Code marketplace is just a git repo containing this file) |
| `noname-mcp/` | the plugin: a thin stdio proxy, 9 slash commands, one onboarding skill — see [its README](noname-mcp/README.md) |
| `LICENSE` | Apache-2.0 |

## What you need

1. **Claude Code.**
2. **The MCP server** — a small local Windows service that exposes the backup tools over MCP (default
   `http://localhost:19360/mcp`). Not bundled: the plugin's guided setup can install it for you (with your
   explicit consent), or you can run its installer yourself. It ships as a release asset of this repo.
3. **A Windows backup agent** — the product that actually performs the backups; the MCP server drives it. Installed
   separately, by you: the plugin only detects it and links to its download, never installs it silently.

## Install the plugin

```bash
claude plugin marketplace add savelev-sa/noname-mcp
claude plugin install noname-mcp
```

If you have more than one marketplace configured, name it explicitly: `claude plugin install noname-mcp@noname-mcp`
(the plugin and the marketplace happen to share a name). From a local clone, point the first command at the clone
directory instead of the repo name. Inside a session the equivalent route is
`/plugin marketplace add savelev-sa/noname-mcp`, then install `noname-mcp` from the `/plugin` menu.

## First run

Run `/setup`. It reports one of three states and acts on it:

- **Server missing, installer known** — it asks you, in plain language, whether to install now. On a yes it
  downloads the installer, runs it silently, and Windows shows an approval (UAC) prompt — the install is never
  silent about *itself*, only about its own wizard. It then verifies: installer exit code, then the service
  answering on `/health`.
- **Server missing, no installer URL on this machine** — it tells you to ask your administrator, and does not
  download anything.
- **Backup agent missing** — it shows the official download link. It will not install the agent for you.

When the service comes up the proxy notices by itself and the real backup tools appear **in the same session** —
no Claude Code restart (a restart is only the fallback if they fail to show).

## Commands

| Command | What it does |
|---|---|
| `/setup` | onboarding and health check: detect the service and the agent, install what is missing (with consent) or link it |
| `/destinations` | list, add, and test storage destinations (local, Wasabi, Amazon S3, Backblaze) |
| `/new-plan` | guided creation and scheduling of a file backup plan |
| `/edit-plan` | change an existing plan (schedule, retention, sources, failure email) in place, never by rebuilding it |
| `/run` | run a plan now (incremental, full, or differential) |
| `/status` | last session result and recent failures, per plan or across all plans |
| `/restore` | guided restore: browse restore points, pick a version, restore, verify |
| `/report` | backed-up volume per plan or session, occupied space per destination |
| `/license` | assign a license, report active license types and counts |

The commands orchestrate the MCP tools the local server exposes; they do not define tools of their own.

## Tool surface

The server deliberately keeps `tools/list` short: the common backup flows are first-class tools, and the long tail
of more specialized capabilities is reached on demand through meta-tools (`search_tools`, `get_tool_info`,
`execute_tool`) instead of being carried in every request. Tools the server knows to be destructive are confirm-gated
by the server itself, not only by the prompt — the flag is per tool, so that gate protects the tools it has been set
on and nothing else. That is why the commands here ask for confirmation and name what would be lost on their own,
rather than assuming a gate will catch it. The exact set belongs to the server and is documented with it — this page does not repeat
the numbers, because a count copied here would drift the first time the server changes one.

## Configuration

**No environment variable is required** — the installer URL ships baked in and the endpoint has a working default. That
is a statement about settings only: getting to a working state still takes the three installs described above (this
plugin, the MCP server, the backup agent), and nothing here claims otherwise. Four variables exist for non-standard
setups and testing — names, defaults and exact meanings in one place, the
[plugin README](noname-mcp/README.md#proxy-config-local-only---never-from-a-tool-argument-or-store). They are read
locally by the proxy and never taken from a tool argument or from content the model has read.

## Status and scope

- **Pre-release, `v0.1.0`.** Not listed in any public plugin catalog — install it from this repo.
- **Windows only.** No macOS or Linux runtime; multi-machine management is out of scope for this version.
- The guided install pulls `Noname-MCP-Setup.exe` from this repo's latest release. If you host the installer
  somewhere else, point `NONAME_MCP_INSTALLER_URL` at it; otherwise nothing to configure.
- The plugin never installs the backup agent silently, and the MCP server is installed only after you say yes.
- **The plugin does not update itself.** Installing a newer version is something you do, the same way you installed it.
- The server, once installed as a service, does have an update path — it can check for a newer build and install one.
  That is stated as a fact, not offered as a feature: **no successful update has been demonstrated on a real machine**
  — a real candidate downloaded, installed, and the new version serving. What has been demonstrated is the opposite
  direction, that an unsuitable candidate is refused, which says nothing about a good one being applied. So this page
  does not tell you to rely on it, and you should keep an eye on the version you are running.

## License

Apache-2.0 — see [LICENSE](LICENSE).
