# noname-mcp - the plugin

How this plugin works. For installation and day-to-day use, start at the [repo README](../README.md).

The plugin ships a **thin stdio proxy**, 9 slash commands and one onboarding skill — no server binary. The MCP
server is installed separately and runs as a local Windows service; the proxy forwards MCP JSON-RPC between
Claude Code (stdio) and that service (HTTP, SSE-aware). Windows v1, Apache-2.0 (see [LICENSE](../LICENSE)).

- **Plugin id** `noname-mcp`, version 0.1.0, pre-release — not listed in any public plugin catalog.
- **Why a proxy and not a bundle:** the repo stays git-friendly (no server binary in version control at all), and
  the server is installed and serviced separately from the plugin. The server does carry an update path — wired only
  when it runs as the published service executable, so a development run checks but never acts. Deliberately not
  claimed here as a feature: no SUCCESSFUL update has been demonstrated on a real machine — the demonstrated cases are
  refusals, which prove a bad candidate is rejected and nothing about a good one being applied. A reader who believes
  "it updates itself" stops watching the version.
- **Server endpoint:** `http://localhost:19360/mcp` by default.

## Prerequisites (both installed separately)

1. **MCP server** — the local Windows service exposing the MCP endpoint. `/setup` can install it for you after you
   explicitly agree (silent installer + a Windows UAC prompt), or you can run the installer yourself.
2. **Backup agent** — the backup product the server drives. Detected and linked only; never silently installed.

If either is missing the proxy does not crash: it degrades to onboarding (below).

## Degraded modes

| Situation | Behavior |
|---|---|
| Service absent at startup | The proxy acts as a minimal MCP server exposing exactly one tool, `noname_setup`, which returns a plain-language message plus a structured status (`server_installed`, `endpoint`, `installer_url`, `installer_url_configured`, `agent_installed`, `next_action`). |
| Service appears mid-session (e.g. just installed) | A background poll (every 4s) and a lazy check on each tool call promote the proxy to forward mode: it performs its own `initialize`, then emits `notifications/tools/list_changed` so the host reloads the real tool list **in the same session**. A Claude Code restart is only the documented fallback. |
| Service disappears mid-session | Forwarding retries (3 attempts, 1.5s apart) on connection errors, then degrades back to onboarding instead of failing hard. |
| The host shuts the proxy down | The session is RELEASED immediately — `DELETE` on the MCP path carrying the session id the server issued — instead of being left for the server's inactivity timeout. Bounded by an 800ms budget so shutdown is never delayed, skipped entirely when there is no session, and logged when it could not be delivered. A killed process cannot say anything, so the server's timeout stays the backstop for that case. |
| Version mismatch | The proxy still forwards, but warns which side to update: the server's MAJOR must equal `NONAME_MCP_COMPAT_MAJOR`; minor/patch drift is tolerated. |

Liveness for promotion is the `/mcp` `initialize` call, deliberately **not** `/health` — health aggregates agent
status and can take seconds, which says nothing about whether forwarding will work.

## Commands and skill

`/setup`, `/destinations`, `/new-plan`, `/edit-plan`, `/run`, `/status`, `/restore`, `/report` — described in the
[repo README](../README.md#commands). They orchestrate the server's MCP tools; they define none of their own.

The `onboarding` skill covers the same ground as `/setup` for free-form requests ("backups aren't working"), and
includes a last-resort fallback for the case where the proxy itself failed to load.

Both carry a **Voice** directive: the reader is a backup admin, not a developer. Endpoints, URLs, JSON field names
and words like "MCP server" or "proxy" stay out of the default narration; the technical detail lives in the tool's
`structuredContent` for the assistant to act on, not to read aloud.

## Tool surface

Once the service is up, `tools/list` shows a small first-class set — the common backup flows — plus three
meta-tools (`search_tools`, `get_tool_info`, `execute_tool`) through which the long tail is reached on demand.
Tools the server has been MARKED destructive are confirm-gated server-side, and the gate is decided **per call from
its arguments** rather than per tool: a restore that replaces the live database is destructive, the same tool asked to
restore beside it is not. A whole-tool marking is the constant case of that same rule. So a catalogue can only tell you
whether a tool COULD be destructive, never whether your call will be — and the coverage still cannot be relied on as a
property of the surface, because a destructive tool nobody wrote a rule for passes through ungated. This is not
hypothetical: two tools were found making the same configuration-replacing call with only one of them flagged. So the
commands here confirm and name the loss themselves; the server-side gate is a second layer, never the reason to skip
the first.

What that means for the commands here, which is the part this repository owns: a command names a first-class tool
directly when one exists for the job, and routes anything else through the meta-tools. Which tools are first-class
is the server's decision and is documented with the server — deliberately not restated here, because a copied
inventory drifts silently the first time the server changes one and nothing in this repository would notice.

## Layout

```
noname-mcp/
  .claude-plugin/plugin.json
  .mcp.json                    # launches the proxy over stdio (node)
  proxy/mcp-proxy.mjs          # thin stdio <-> HTTP MCP proxy to the local service
  commands/*.md                # the 9 commands above
  skills/onboarding/SKILL.md
```

## Proxy config (local only - never from a tool argument or store)

| Env var | Default | Purpose |
|---|---|---|
| `NONAME_MCP_URL` | `http://localhost:19360/mcp` | installed MCP-server service endpoint |
| `NONAME_MCP_INSTALLER_URL` | baked-in constant (`INSTALLER_URL_DEFAULT` in the proxy = this repo's `releases/latest/download/Noname-MCP-Setup.exe`) | OVERRIDE for non-standard setups only — users need NO env var: a real hosted URL ships baked into the plugin. Dev/test machines serving the exe from a local landing page set this |
| `NONAME_MCP_COMPAT_MAJOR` | `1` | compatible server MAJOR (semver major must match; minor/patch drift tolerated) |
| `NONAME_MCP_PRODUCT_NAME` | `your backup software` | how the backup product is NAMED to the user in onboarding messages; the source carries no product branding, so set this to the real name |

The onboarding status reports `installer_url_configured: false` when the effective value is not a URL — that is
what turns the offer to install into "ask your administrator" instead.

## Out of scope (v1)

- Hosting the MCP-server installer beyond this repo's releases; silent or assisted install of the backup agent;
  multi-machine management; macOS/Linux runtime.
