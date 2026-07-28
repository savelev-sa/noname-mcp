---
name: setup
description: Backup onboarding and health check. Detects the local MCP-server service and the backup agent; can install the MCP server for you (with your consent), and links you to install the agent. Works even when the service or agent is absent.
---

# /setup - onboarding

The plugin ships only a thin proxy. The MCP server is a separately-installed local service; the backup agent is a separate product. Get the user to a working state.

**Voice (important):** the user is a backup admin, not a developer. In everything you SAY, use plain language — "a quick one-time setup is needed", "installing…", "ready". Do NOT surface internals in the default narration: no endpoints/URLs, no JSON or field names, no `next_action`/`installer_url` tokens, no "MCP server"/"proxy"/"localhost:19360". The `noname_setup` result already carries a plain-language message (it names the backup product as this machine is configured to name it) and an `assistant_note` — relay those. The mechanics below are for YOU to execute, not to read aloud. Only expose technical detail if the user explicitly asks.

1. **Ask the proxy, not the shell.** If the full backup toolset is available, the server is up - call `get_agent_health` and skip to step 3. If only the `noname_setup` tool is exposed, call it: it returns ONE structured status `{server_installed, endpoint, installer_url, installer_url_configured, agent_installed, next_action}` - act on `next_action`. Do NOT probe via shell (curl /health, printenv, registry, Program Files) - the proxy already did all of that. Shell probing is the LAST-RESORT fallback ONLY when the proxy MCP itself failed to load (see the `onboarding` skill).
2. **Act on `next_action`:**
   - **`configure_installer_url`** - setup isn't configured on this computer yet. Say plainly: "A one-time setup is needed, but it hasn't been configured on this computer yet — please ask your administrator to finish it." (For the admin, if asked how: set the `NONAME_MCP_INSTALLER_URL` environment variable to the page or file serving the installer, then reload.) Do NOT attempt a download.
   - **`install_server`** - offer to install it (consent-gated):
   a. **Ask for explicit confirmation FIRST (mandatory), in plain language:** e.g. "A quick one-time setup is needed. I can install it now — it takes about a minute and Windows will ask you to approve it. Go ahead?" If the user declines -> tell them they can also run the installer themselves, and stop. (Under the hood the source is the status's `installer_url`; don't say the URL unless asked.)
   b. On consent: download the installer from the status's `installer_url` (do NOT hardcode a URL or a filename here - the status is the contract).
   c. Run the downloaded exe SILENTLY: `<installer.exe> /VERYSILENT /SUPPRESSMSGBOXES /NORESTART`. Tell the user (plainly) that a Windows approval prompt will appear. (Mechanics: the installer self-elevates; UAC appears unless the shell is already elevated.)
   d. **Verify (mechanics — say only "installing…" / "done" to the user):** installer process exit code `0` = success (non-zero = failure); then re-probe `http://localhost:19360/health` until it responds. On non-zero exit or a /health that never comes up, tell the user setup didn't complete and offer to try again or install manually.
      Once it responds, the proxy detects the server by itself (background re-probe) and refreshes the tools in the SAME session (`notifications/tools/list_changed`) — calling `noname_setup` again also triggers this. Restart Claude Code ONLY if the backup tools still do not appear (fallback).
   e. **Manual fallback (always available):** the user can instead double-click the same downloaded installer.
   f. **Uninstall / repair (if needed):** run `unins000.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART` from the server's install directory (it is also registered in Apps & Features).
3. **Backup agent** - detect it (`get_agent_health` when the server is up, or the `agent_installed` field of the `noname_setup` status). If ABSENT, only show / open the official download link via `open_download_page` - NEVER silently install the agent.
   - Official agent download: https://www.msp360.com/backup/windows-backup-software/
4. **Ready?** - once everything is up, tell the user plainly that backups are ready to manage and what they can do next (add a storage destination, create a backup plan, check status, restore) — in words, not command tokens.

Windows v1. The MCP-server installer may be run silently ONLY with the user's explicit consent (step 2a). The backup AGENT is never silently installed - detect + link only.
