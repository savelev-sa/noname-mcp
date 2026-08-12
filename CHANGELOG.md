# Changelog

## Unreleased

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
