---
name: onboarding
description: Use whenever someone wonders whether backup is set up on this machine at all, or when backup tools are missing or failing - "I just got this machine, is the backup thing even set up here", "is backup working on this box", "the backup tools aren't loading", "nothing backup-related shows up", first-time setup, or a machine that used to work and stopped. Carries the rules that go with it - never install the backup agent silently, never shell-probe for it, and how to read the setup status without mistaking a leftover data folder for an installed agent.
version: 0.3.0
---

# Onboarding and Health Check

**Voice (important):** the user is a backup admin, not a developer. Everything you SAY must be plain language — "a quick one-time setup is needed", "installing…", "ready". Keep internals OUT of the default narration: no endpoints/URLs, no JSON or field names, no `next_action`/`installer_url` tokens, no "MCP server"/"proxy"/"localhost:19360". The `noname_setup` result carries a plain-language message (it names the backup product as this machine is configured to name it) + an `assistant_note` — relay those; the steps below are for YOU to execute, not to read aloud. Expose technical detail only if the user asks.

The proxy owns the diagnostics. Do NOT shell-probe (curl, printenv, registry, Program Files checks) - ask the proxy instead; shell probing is the last-resort fallback ONLY when the proxy MCP itself failed to load.

1. **Ask the proxy.** If the full backup toolset is available, the server is up - use `get_agent_health`. If only `noname_setup` is exposed (server absent), call it: it returns ONE structured status
   `{server_installed, endpoint, installer_url, installer_url_configured, agent_installed, next_action}`.
2. **Act on `next_action`:**
   - **`configure_installer_url`** - setup isn't configured on this computer yet. Say plainly: "A one-time setup is needed, but it hasn't been configured on this computer yet — please ask your administrator to finish it." (Admin mechanics, only if asked: set the `NONAME_MCP_INSTALLER_URL` environment variable to the page or file serving the installer, then reload.) Do NOT download.
   - **`install_server`** - offer the consent-gated install, same flow as `/setup`:
     - Ask explicit confirmation first, in plain language: "Setting this up needs a one-time install on this computer. I can download it and run it now — it takes about a minute, and Windows will ask you to approve it. Go ahead?" That wording names BOTH verbs (consent to a download is not consent to running it) and warns about the Windows prompt BEFORE it appears — an unannounced elevation dialog loses the cautious admin and trains the careless one to click through.
     - **On consent, call `noname_install_server` with `confirmed: true`. Do NOT do this through the shell.** The tool downloads, verifies the file against the checksum published with the release BEFORE anything is executed, runs it silently, and polls until the service answers. Shell steps here are the improvised flow this tool replaced: they cannot verify a checksum, and they run an elevated installer on the user's machine on the strength of a URL.
     - **If they decline, do not ask again.** Tell them they can run the installer by hand later, and leave it there. Re-asking teaches a flow to treat "no" as "not yet", which is pressure wearing the shape of helpfulness.
     - **Relay what the tool reports, including which state the machine is in** — that is the part failure text normally omits and it decides what the user should do next. A **checksum mismatch** means nothing was installed and nothing will be: say so, and do NOT retry, because this surface cannot tell a corrupted download from a substituted one. A **non-zero installer exit** is the one failure that can leave the machine CHANGED — say it may be partly installed, since "setup failed" implies the opposite and nobody goes looking for a half-installed service.
     - After install the proxy detects the server by itself (background re-probe) and refreshes the tool list in the SAME session; calling `noname_setup` again also triggers this (`next_action: reload_tools`). ONLY if the tools still do not appear (fallback): ask the user to **QUIT the app completely and reopen it** — and say that closing the window is not enough on an app that keeps running in the tray or menu bar, so they right-click the tray icon and choose Quit (Выход) first. Measured on a real machine: told to "restart", a user closes the window, the process keeps running, nothing reloads, and they conclude the product is broken.
     - **What a finished install may NOT be reported as:** working, protected, or ready. It may say setup completed and the backup tools are available. Installing this service is not having an agent, a destination or a plan — and "you're protected now" is exactly the sentence a user stops checking after.
3. **Backup agent:** read `agent_installed` from the status (or `get_agent_health` when the server is up). If ABSENT, only link to the official download - NEVER silently install the agent:
   - https://www.msp360.com/backup/windows-backup-software/

## Last-resort fallback (ONLY if the proxy MCP itself failed to load)

If no backup MCP tools are available at all (the proxy did not start), fall back to direct checks. These probe the
backup product's REAL install locations, so they name the vendor - that is unavoidable, they are the paths on disk:
- MCP-server service: probe `http://localhost:19360/health` (default; configurable via `NONAME_MCP_URL`).
- Agent — proof is the CLI EXECUTABLE or the registry, either of: `cbb.exe` under
  `C:\Program Files\MSP360\Managed Backup\` or `C:\Program Files\CloudBerryLab\CloudBerry Backup\`; registry
  `HKLM\SOFTWARE\MSP360\Managed Backup` or `HKLM\SOFTWARE\CloudBerryLab\CloudBerry Backup`.
- The data directory `C:\ProgramData\CloudBerryLab\CloudBerry Backup\` proves only that the product was installed
  at some point — it SURVIVES uninstall. Never read it as "the agent is installed"; the proxy deliberately does not.

The MCP-server installer may be run silently ONLY with explicit consent. The backup AGENT is never silently
installed (detect + link only). Windows v1.
