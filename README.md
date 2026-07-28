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

From a local clone, point the first command at the clone directory instead of the repo name. Inside a session the
equivalent route is `/plugin marketplace add savelev-sa/noname-mcp`, then install `noname-mcp` from the `/plugin`
menu.

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

The server keeps `tools/list` small: **17 first-class tools** — 14 promoted common-flow tools (health, plans,
run/stop, progress, restore points, quick restore, storage accounts, history, diagnostics) plus 3 meta-tools
(`search_tools`, `get_tool_info`, `execute_tool`). Everything else — roughly a hundred more specialized
capabilities — is reachable through `execute_tool`, so the model discovers them on demand instead of carrying
them in every request. Destructive tools are confirm-gated by the server itself, not only by the prompt.

## Configuration

Nothing is required: the installer URL ships baked into the plugin. All settings are environment variables read
locally by the proxy — never taken from a tool argument. Full table in the
[plugin README](noname-mcp/README.md#proxy-config-local-only---never-from-a-tool-argument-or-store).

| Variable | Default | Use |
|---|---|---|
| `NONAME_MCP_URL` | `http://localhost:19360/mcp` | where the local MCP service listens |
| `NONAME_MCP_INSTALLER_URL` | this repo's `releases/latest/download/Noname-MCP-Setup.exe` | override the installer source (non-standard setups, local testing) |
| `NONAME_MCP_COMPAT_MAJOR` | `1` | MCP-server major version this plugin speaks |
| `NONAME_MCP_PRODUCT_NAME` | `your backup software` | how the backup product is named to you in setup messages |

## Status and scope

- **Pre-release (v0.1.0).** Not listed in any public plugin catalog — install it from this repo.
- **Windows only.** No macOS or Linux runtime; multi-machine management is out of scope for this version.
- The guided install needs a published release carrying `Noname-MCP-Setup.exe`. Until one exists, either set
  `NONAME_MCP_INSTALLER_URL` to wherever you host the installer, or install the server manually.
- The plugin never installs the backup agent silently, and the MCP server is installed only after you say yes.

## License

Apache-2.0 — see [LICENSE](LICENSE).
