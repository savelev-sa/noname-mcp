#!/usr/bin/env node
/**
 * noname-mcp plugin — thin STDIO proxy to the LOCAL MCP-server service.
 *
 * Distribution model: the plugin ships ONLY this small proxy (no embedded server exe).
 * The MCP server is installed separately (its own installer) and runs as a local service
 * exposing an HTTP MCP endpoint. The host (Claude Code) launches this proxy over stdio; it
 * forwards MCP JSON-RPC stdin<->the service endpoint (HTTP, SSE-aware).
 *
 * Degraded modes (no hard crash):
 *  - service ABSENT   -> acts as a minimal one-tool onboarding MCP server (installer link) AND keeps
 *                        re-probing the /mcp endpoint (background poll + lazily on each call); when the
 *                        service comes up mid-session (e.g. it was just installed), the proxy performs its
 *                        own initialize handshake, switches to forward mode and emits
 *                        notifications/tools/list_changed so the host reloads the real tool list —
 *                        no Claude Code restart needed (restart stays a documented fallback only).
 *  - version MISMATCH -> forwards anyway, but tells the client which side to update.
 *
 * Config is LOCAL ONLY (env / defaults) — never from a tool argument or store content.
 *   NONAME_MCP_URL            installed service endpoint   (default http://localhost:19360/mcp)
 *   NONAME_MCP_INSTALLER_URL  installer download for the onboarding redirect when the SERVICE is absent.
 *                             Default = the public release asset baked in below (INSTALLER_URL_DEFAULT),
 *                             so the shipped default is a real hosted URL, never localhost. For dev/e2e,
 *                             override with the local landing page (http://localhost:8088/).
 *   NONAME_MCP_COMPAT_MAJOR   MINIMUM supported server MAJOR (default 0). A FLOOR, not an exact match: an older
 *                             major is reported as too old, a newer one is noted and forwarded to anyway. It
 *                             refuses nothing either way - see checkVersion, which warns and returns.
 *   NONAME_MCP_PRODUCT_NAME   how the backup product is NAMED to the user in messages (default: a generic
 *                             phrase — deployments set the real product name).
 */

import { createInterface } from 'readline';
import { agentInstalled } from './agent-detect.mjs';

const MCP_URL = process.env.NONAME_MCP_URL || 'http://localhost:19360/mcp';
// How the backup product is NAMED to the user. One place, env-overridable: the source carries no product
// branding, and a deployment that wants the real name sets NONAME_MCP_PRODUCT_NAME.
const PRODUCT_NAME = process.env.NONAME_MCP_PRODUCT_NAME || 'your backup software';
// The installer URL SHIPS BAKED INTO THE PLUGIN: INSTALLER_URL_DEFAULT is what users get — no env var needed.
// It resolves to the LATEST published release asset of this repo, so the shipped default is a real hosted URL
// (the release checklist blocks localhost defaults in public builds). The FILENAME is a contract with the
// installer build: change it on one side only and the download 404s. Dev/test machines that serve the exe from
// a local landing page override with NONAME_MCP_INSTALLER_URL (override for non-standard setups only).
const INSTALLER_URL_DEFAULT = 'https://github.com/savelev-sa/noname-mcp/releases/latest/download/Noname-MCP-Setup.exe';
const SERVER_INSTALLER_URL = process.env.NONAME_MCP_INSTALLER_URL || INSTALLER_URL_DEFAULT;
// "Configured" = there IS somewhere to send the user. Deliberately NOT a comparison against the default: that
// form misfired the moment the real URL became the default. An empty or non-URL value is what makes onboarding
// say "ask your administrator" instead of offering to install.
const INSTALLER_URL_CONFIGURED = /^https?:\/\/\S+/.test(SERVER_INSTALLER_URL);
// Proxy<->server compat: require the server MAJOR to equal this; minor/patch drift is OK (warn only).
// MINIMUM supported server major, not an exact one. Default 0 because the shipped server is 0.x; a 1.x server is
// forwarded to without complaint rather than being called "too new".
const COMPAT_MIN_MAJOR = parseInt(process.env.NONAME_MCP_COMPAT_MAJOR || '0', 10);

// Tell the server which server MAJOR this proxy can drive, by adding it to the initialize handshake. The server
// keeps the last handshaked value so a self-update can REFUSE a cross-MAJOR candidate instead of installing it
// and leaving the pair mismatched — the plugin has no auto-update channel, so "update the plugin" would be a
// manual step for a user who changed nothing. Same constant the mismatch check uses; purely additive, and a
// server that ignores the field keeps working exactly as before.
// Sent in BOTH carriers on purpose. `_meta` is the protocol's extension bag and survives deserialization, which
// is what the server actually reads; `clientInfo` is a CLOSED type in at least one server SDK, so an unknown
// member there is dropped before any server code sees it — measured on the server side, invisible from here.
// Keeping the clientInfo copy costs nothing, stays useful for anything that logs the raw handshake, and means a
// future SDK that does preserve it needs no change here.
const withCompatMajor = (params) => ({
  ...(params || {}),
  // The wire field keeps its name so the server side reads what it always read; its VALUE is now the minimum
  // supported major rather than an exact one, and the server maintainers were told so rather than left to infer it.
  _meta: { ...(params?._meta || {}), compatMajor: COMPAT_MIN_MAJOR },
  clientInfo: { ...(params?.clientInfo || {}), compatMajor: COMPAT_MIN_MAJOR },
});

const HEALTH_TIMEOUT_MS = 8000;
const HEALTH_RETRY_MS = 400;
const REQUEST_RETRY_MS = 1500;
const REQUEST_MAX_RETRIES = 3;
const ABSENT_REPROBE_MS = 4000;   // while absent: background /mcp liveness-poll interval (mid-session install)
const GOODBYE_TIMEOUT_MS = 800;   // budget for the session-release DELETE on shutdown; never stall the host

const log = (m) => process.stderr.write(`[mcp-proxy] ${m}\n`);

let sessionId = null;
let mode = 'forward';        // 'forward' | 'absent'
let serverVersion = null;
let lastInitParams = null;   // host's initialize params, replayed to the server on mid-session promotion
let promoting = false;       // re-entrancy guard for tryPromote

// --- semver major check (a FLOOR: at or above the minimum; minor/patch drift always tolerated) ---
function majorOf(v) {
  const m = /^(\d+)\./.exec(String(v || '').trim());
  return m ? +m[1] : null;
}
// Returns 'ok' | 'server-too-old' | 'server-newer' | 'unknown'
//
// A FLOOR, not an exact match. It used to be an exact match, and that produced a measured user-facing defect: the
// published plugin demanded major 1, the published server declared 0.2.0, and the user was told to "update the MCP
// server" to a version that DOES NOT EXIST. Setting the exact value to 0 would have fixed that day and created the
// mirror defect on the day the server reaches 1.0.0 - "update the plugin" while the plugin is already current.
//
// A newer major is reported but NOT treated as an error. This check refuses nothing (see checkVersion - it warns and
// returns), so its entire product is a sentence a human reads. A sentence that instructs an action the reader cannot
// take is worse than silence, because it sends them looking for a release that may not exist.
function compat(versionStr) {
  const maj = majorOf(versionStr);
  if (maj == null) return 'unknown';
  if (maj < COMPAT_MIN_MAJOR) return 'server-too-old';
  if (maj > COMPAT_MIN_MAJOR) return 'server-newer';
  return 'ok';
}

// --- probe the installed service ---
// Liveness is asked of `/mcp`, NOT `/health` — the same choice tryPromote already made and for the same reason,
// which this probe should have shared from the start.
//
// The old probe aborted at 2500 ms, so it declared a healthy server ABSENT every single time — deterministic, not
// flaky. The user then got the one-tool absent surface and a real question answered with "setup is finished".
//
// **`/health` is slow BECAUSE the product is installed**: it aggregates backup and RM service state. So the failure
// landed exactly on the machines where everything works, and a bare machine — where /health is fast — looked fine.
// That is why the repair is the ENDPOINT and not a bigger number: raising 2500 would be guessing against a latency
// that belongs to how much the agent has to report, which is not a property this proxy controls.
// The question is only "is anything listening", so ANY HTTP response answers it — including a refusal. A session-free
// `ping` gets a fast JSON-RPC error and that error IS the proof of life; a dead endpoint throws on connect instead.
//
// It deliberately does NOT send `initialize`. An initialize would put a second client identity on the wire, and the
// host's own identity must be the only one the server ever sees — a contract test caught exactly that when this probe
// first used one, which is the reason this shape exists rather than the obvious one.
//
// MEASURED against a real installed server, three runs each:
//     /health              3100 / 3168 / 3073 ms   <- the old probe, aborting at 2500
//     ping, no session       63 /    5 /    3 ms
//     dead endpoint           3 ms, throws         <- up and down are unambiguous
async function probeServer() {
  const start = Date.now();
  log(`probing service at ${MCP_URL} ...`);
  while (Date.now() - start < HEALTH_TIMEOUT_MS) {
    try {
      // Any answer at all means the service is up. The response BODY is irrelevant and is not parsed.
      await fetch(MCP_URL, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'mcp-proxy-probe', method: 'ping' }),
        signal: AbortSignal.timeout(3000) });
      log(`service ready (${Date.now() - start}ms)`);
      return true;
    } catch { /* not up yet: connection refused, or slower than the per-attempt ceiling */ }
    await new Promise(r => setTimeout(r, HEALTH_RETRY_MS));
  }
  return false;
}

const out = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

// --- silent request to the HTTP service (nothing written to stdout; returns the parsed response or null) ---
async function serverRequest(msg, timeoutMs = 4000) {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(MCP_URL, { method: 'POST', headers, body: JSON.stringify(msg),
                                     signal: AbortSignal.timeout(timeoutMs) });
  const sid = res.headers.get('mcp-session-id'); if (sid) sessionId = sid;
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (ct.includes('text/event-stream')) {
    for (const block of text.split('\n\n')) for (const ln of block.split('\n'))
      if (ln.startsWith('data: ') && ln.slice(6).trim()) { try { return JSON.parse(ln.slice(6)); } catch { /* next */ } }
    return null;
  }
  if (ct.includes('application/json') && text.trim()) { try { return JSON.parse(text); } catch { return null; } }
  return null; // 202/204 for notifications
}

// --- mid-session promotion: the service came up while we were in absent mode (e.g. it was just installed).
// Handshake with it ourselves (the host already got the onboarding initialize), switch to forward mode and
// tell the host the tool list changed so it reloads the real tools without a restart.
async function tryPromote() {
  if (mode !== 'absent' || promoting) return false;
  promoting = true;
  try {
    // Gate promotion on the REAL liveness: the /mcp initialize itself (~ms when the service is up;
    // instant connection-refused when it is not). Deliberately NOT gated on /health — it aggregates
    // backup/RM service status and can take 2s+, which is neither fast nor what forwarding needs.
    sessionId = null; // any prior session is stale
    const initRes = await serverRequest({ jsonrpc: '2.0', id: 'mcp-proxy-init', method: 'initialize',
      params: withCompatMajor(lastInitParams || { protocolVersion: '2024-11-05', capabilities: {},
                                                 clientInfo: { name: 'mcp-proxy', version: '0.1.0' } }) }, 3000);
    if (!initRes?.result) { sessionId = null; return false; }
    await serverRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }).catch(() => {});
    checkVersion(JSON.stringify(initRes));
    mode = 'forward';
    log('service came up mid-session -> switched to forward mode');
    out({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    return true;
  } catch { return false; }
  finally { promoting = false; }
}
// Background re-probe while absent (covers "installed but the user never calls another tool" too).
// unref: never keeps the process alive past stdin close.
setInterval(() => { tryPromote(); }, ABSENT_REPROBE_MS).unref();

// --- local onboarding server (used in 'absent' mode: the MCP SERVICE is not reachable) ---
// The proxy owns the diagnostics: endpoint probe (startup + every forward), env config, and agent detection
// (see agent-detect.mjs — the rule is "the CLI executable exists", not "a directory exists") — so
// noname_setup returns ONE structured status and the caller never shell-probes.

// The assistant reads content[0].text. Keep that PLAIN-LANGUAGE for a non-technical backup admin: say what is
// missing and the one action to take. All technical detail (endpoint, installer URL, next_action) lives in
// structuredContent only, so it never lands in the default narration. `assistant_note` steers the wording.
function setupStatus() {
  const status = {
    server_installed: false,
    endpoint: MCP_URL,
    installer_url: SERVER_INSTALLER_URL,
    installer_url_configured: INSTALLER_URL_CONFIGURED,
    agent_installed: agentInstalled(),
    next_action: INSTALLER_URL_CONFIGURED ? 'install_server' : 'configure_installer_url',
    assistant_note: INSTALLER_URL_CONFIGURED
      ? `Tell the user in plain language that ${PRODUCT_NAME} needs a quick one-time setup and ask yes/no to ` +
        'install it now (mention Windows will ask them to approve it). Do NOT read out endpoints, URLs, JSON, ' +
        'next_action, "MCP server" or "proxy" unless the user asks for technical details.'
      : `Tell the user in plain language that ${PRODUCT_NAME} needs a one-time setup but it is not yet ` +
        'configured on this computer, so they should ask their administrator to finish it. Do NOT read out ' +
        'endpoints, URLs, JSON, next_action, "MCP server" or "proxy" unless the user asks for technical details.',
  };
  const text = INSTALLER_URL_CONFIGURED
    ? `Before I can manage your backups, ${PRODUCT_NAME} needs a quick one-time setup. I can do it for you ` +
      `now — it takes about a minute, and Windows will ask you to approve it. Would you like me to go ahead?`
    : `Before I can manage your backups, ${PRODUCT_NAME} needs a one-time setup, but it hasn't been configured ` +
      `on this computer yet. Please ask your administrator to finish the setup — then I can continue. ` +
      `(This is a one-time step.)`;
  return { status, text };
}

async function handleAbsent(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') lastInitParams = params || null;
  if (!('id' in msg)) return; // notification — ignore
  if (method === 'initialize') {
    return out({ jsonrpc: '2.0', id, result: {
      protocolVersion: params?.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'noname-mcp (onboarding — MCP server not installed)', version: '0.1.0' },
    }});
  }
  if (method === 'tools/list') {
    return out({ jsonrpc: '2.0', id, result: { tools: [{
      name: 'noname_setup',
      description: 'Check whether the backup software is set up and guide the user through the one-time ' +
        'install if needed. ' +
        'Returns a plain-language message to relay plus structured details (act on next_action; the ' +
        'assistant_note says how to word it — keep endpoints/URLs/JSON out of the default narration).',
      inputSchema: { type: 'object', properties: {} },
    }, {
      name: INSTALL_TOOL,
      description: 'Perform the one-time setup: download the backup service installer, verify it against the ' +
        'checksum published with the release, and run it. REQUIRES the user to have agreed first - pass confirmed ' +
        'only after they said yes, and tell them Windows will ask them to approve it. Refuses rather than guessing ' +
        'if no published checksum can be read, or if the download does not match it.',
      inputSchema: {
        type: 'object',
        properties: { confirmed: { type: 'boolean',
          description: 'True only if the user has explicitly agreed to install now.' } },
        required: ['confirmed'],
      },
    }]}});
  }
  if (method === 'tools/call' && msg.params?.name === INSTALL_TOOL) {
    // Consent is the CALLER's to obtain and this tool's to require. Refusing without it is not ceremony: the next
    // thing that happens is an elevated installer running on someone's machine.
    if (msg.params?.arguments?.confirmed !== true)
      return out({ jsonrpc: '2.0', id, result: {
        content: [{ type: 'text', text: 'Ask the user first, then call this again once they agree. Use words like: ' +
          "\"Setting this up needs a one-time install on this computer. I can download it and run it now - it " +
          "takes about a minute, and Windows will ask you to approve it. Go ahead?\" " +
          'It names BOTH verbs on purpose - consent to a download is not consent to running it - and it warns about ' +
          'the Windows prompt BEFORE it appears. If they decline, do NOT ask again: tell them they can run the ' +
          'installer by hand later, and leave it there.' }],
        structuredContent: { installed: false, reason: 'not_confirmed' },
        isError: false,
      }});
    const r = await runGuidedInstall();
    if (r.ok) { log('guided install finished and the service answered'); return out(setupFinishedResult(id)); }
    log('guided install did not complete: ' + r.reason);
    return out({ jsonrpc: '2.0', id, result: {
      content: [{ type: 'text', text: r.detail }],
      structuredContent: { installed: false, reason: r.reason, steps_completed: r.steps,
        assistant_note: 'Tell the user in plain language what stopped, using the message above. Do NOT retry ' +
          'automatically after a checksum mismatch - that is the one failure where trying again is the wrong move.' },
      isError: false,
    }});
  }
  if (method === 'tools/call') {
    // Lazy re-probe: the server may have just been installed — promote before answering.
    if (await tryPromote()) return out(setupFinishedResult(id));
    const { status, text } = setupStatus();
    return out({ jsonrpc: '2.0', id, result: {
      content: [{ type: 'text', text }],
      structuredContent: status,
      isError: false,
    }});
  }
  if (method === 'ping') return out({ jsonrpc: '2.0', id, result: {} });
  return out({ jsonrpc: '2.0', id, error: { code: -32601, message: setupStatus().text } });
}

// --- guided install: fetch, VERIFY, then run -------------------------------------------------------------------
//
// It lives in the proxy for a mechanical reason: it has to work BEFORE the server exists, and on a client with no
// shell to run a download in.
//
// The ORDER is the whole point. The checksum is compared BEFORE the file is executed, never after — after is not a
// check, it is a post-mortem on something already run with the user's privileges.
//
// WHERE THE CHECKSUM COMES FROM, measured rather than assumed: the release notes carry none (no 64-hex string anywhere
// in the body), while the API's asset digest field does, and it matches the bytes an anonymous download produces. A
// tool written against the notes would find nothing — and that is the dangerous outcome, because a check that finds no
// checksum looks exactly like a check that passed.
//
// Which is why "no checksum" REFUSES instead of proceeding, and says which situation it is in.
function releaseApiFor(installerUrl) {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/latest\/download\/(.+)$/.exec(installerUrl);
  if (!m) return null;
  return { api: 'https://api.github.com/repos/' + m[1] + '/' + m[2] + '/releases/latest', asset: m[3] };
}

async function publishedChecksum(installerUrl) {
  const r = releaseApiFor(installerUrl);
  if (!r) return { sha256: null, why: 'the installer location is a custom one, so there is no published checksum to compare against' };
  try {
    const res = await fetch(r.api, { headers: { Accept: 'application/vnd.github+json' },
                                     signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { sha256: null, why: 'the release information could not be read (HTTP ' + res.status + ')' };
    const j = await res.json();
    const a = (j.assets || []).find(x => x.name === r.asset);
    if (!a) return { sha256: null, why: 'the release does not carry the expected file' };
    const d = /^sha256:([a-f0-9]{64})$/i.exec(a.digest || '');
    if (!d) return { sha256: null, why: 'the release does not publish a checksum for that file' };
    return { sha256: d[1].toLowerCase(), why: null };
  } catch (e) { return { sha256: null, why: 'the release information could not be reached (' + e.name + ')' }; }
}

// Silent-install switches, taken from the shipped onboarding guidance rather than invented here. Passed as an ARGUMENT
// ARRAY to execFile — never a shell string — so nothing in a path or URL can be read as a command.
const INSTALL_ARGS = ['/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART'];

async function runGuidedInstall() {
  const steps = [];
  const refuse = (reason, detail) => ({ ok: false, reason, detail, steps });

  if (!INSTALLER_URL_CONFIGURED)
    return refuse('not_configured', 'No installer location is configured on this computer.');

  // 1 - the published checksum, BEFORE anything is downloaded or run.
  const { sha256: expected, why } = await publishedChecksum(SERVER_INSTALLER_URL);
  if (!expected) return refuse('no_checksum', 'Refusing to install without a published checksum to verify against: ' + why + '.');
  steps.push('read the published checksum');

  // 2 - download to a temp file.
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { writeFile, unlink, readFile } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const target = join(tmpdir(), 'noname-mcp-setup-download.exe');
  try {
    const res = await fetch(SERVER_INSTALLER_URL, { redirect: 'follow', signal: AbortSignal.timeout(600000) });
    if (!res.ok) return refuse('download_failed', 'The installer could not be downloaded (HTTP ' + res.status + '). Nothing was installed and nothing on this computer changed.');
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
  } catch (e) { return refuse('download_failed', 'The installer could not be downloaded (' + e.name + '). Nothing was installed and nothing on this computer changed.'); }
  steps.push('downloaded the installer');

  // 3 - VERIFY, and refuse on mismatch. Nothing has been executed at this point.
  const actual = createHash('sha256').update(await readFile(target)).digest('hex');
  if (actual !== expected) {
    await unlink(target).catch(() => {});
    log('install REFUSED: checksum mismatch, expected ' + expected.slice(0, 12) + ' got ' + actual.slice(0, 12));
    return refuse('checksum_mismatch',
      'The downloaded installer does not match the checksum published with the release, so it was deleted and NOT run. ' +
      'This is what a corrupted download or a tampered file looks like — do not retry blindly; say what happened.');
  }
  steps.push('checksum matched');

  // 4 - run it, silently, as an argument array.
  const { execFile } = await import('node:child_process');
  const code = await new Promise((resolve) => {
    execFile(target, INSTALL_ARGS, { windowsHide: true, timeout: 600000 }, (err) => resolve(err ? (err.code ?? 1) : 0));
  });
  await unlink(target).catch(() => {});
  // Each failure says what happened, WHAT STATE THE MACHINE IS IN, then what to do — in that order. The state is the
  // part failure text normally omits, and it decides whether the user's next action is right.
  //
  // This one is the only failure of the four that can leave the machine CHANGED, and the natural wording — "setup
  // failed" — implies the opposite. Someone who believes nothing happened will not go looking for a half-installed
  // service, so the sentence has to say it outright.
  if (code !== 0) return refuse('installer_failed',
    'The installer ran but stopped with an error (code ' + code + '). The setup may be PARTLY installed - this is not ' +
    'a case where nothing happened. Do not simply try again: check Apps & Features for an entry, and remove it there ' +
    'before a fresh attempt.');
  steps.push('installer finished');

  // 5 - poll for liveness, the same way the startup probe does.
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await probeServer()) { steps.push('service answered'); return { ok: true, steps }; }
  }
  return refuse('not_healthy', 'The installer finished, so the software IS installed, but the background service is not answering yet. Nothing is broken on the machine - it is installed and not yet working. Try the setup check again in a minute; if it still does not answer, restarting the computer is the usual repair.');
}

// The ONE tool this proxy owns. It is synthesised here, in absent mode, and has NEVER existed on the server.
//
// So a call to it is a call to THE PROXY, in any mode — and forwarding it was the defect, not a missing special case.
// Framing it as "a guard against a race" undersells it: the proxy was forwarding a name it invented, to a server that
// by definition does not implement it, which returns a hard `-32602 Unknown tool` naming a tool this proxy advertised.
//
// REPRODUCED, not inferred (measured against the published proxy and a real server, no mocks): list while
// absent -> one tool; the server appears mid-session; call that tool -> `-32602`. The protocol side is already
// correct — promotion emits `notifications/tools/list_changed` — but the remedy is ASYNCHRONOUS, and a client holding
// a list it was legitimately given can call before it reloads. Announcing cannot close a window; answering can.
//
// This does not accumulate into a pile of special cases, because the proxy owns exactly one tool. If it ever owns a
// second, this becomes a set membership test and stays one line.
const PROXY_OWNED_TOOL = 'noname_setup';
// The second tool this proxy owns. Same ownership argument: it runs BEFORE the server exists, so the server can never
// implement it, so forwarding it would be the same defect PROXY_OWNED_TOOL describes.
const INSTALL_TOOL = 'noname_install_server';

// One response, one definition. The promotion path in absent mode and the guard below must not be able to drift.
const setupFinishedResult = (id) => ({
  jsonrpc: '2.0', id, result: {
    content: [{ type: 'text', text: 'Setup is done and the backup tools are available now.' }],
    // Deliberately NOT "backups are working/protected/ready": installing this service is not having an agent, a
    // destination or a plan. A completed install is not a protected machine, and saying otherwise here would be the
    // reassuring sentence a user acts on.
    structuredContent: {
      server_installed: true, endpoint: MCP_URL, installer_url: SERVER_INSTALLER_URL,
      installer_url_configured: INSTALLER_URL_CONFIGURED, agent_installed: agentInstalled(),
      next_action: 'reload_tools',
      // The fallback wording is deliberate and was measured on a real machine: "restart" is not an instruction a
      // user can follow on a client that minimises to the tray. Closing the window HIDES it, the process keeps
      // running, and nothing reloads - so the user performs the motion, sees no change, and concludes the product
      // is broken. Say QUIT, and name the tray, because that is the step the close button skips.
      assistant_note: 'Tell the user in plain language that setup finished and they can continue with their ' +
        'backup task. Do NOT mention endpoints, proxy, tool lists or restarts unless the tools fail to appear. ' +
        'ONLY if they do not appear: ask the user to QUIT the app completely and open it again - closing the ' +
        'window is not enough on an app that keeps running in the tray or menu bar, so they need to right-click ' +
        'its tray icon and choose Quit (Выход) first.',
    },
    isError: false,
  },
});

// --- forward a message to the HTTP service ---
async function handleForward(msg) {
  // Answer for ourselves before forwarding: see PROXY_OWNED_TOOL above.
  if (msg.method === 'tools/call' && msg.params?.name === PROXY_OWNED_TOOL) {
    log(`answered ${PROXY_OWNED_TOOL} locally in forward mode (stale tool list from absent mode)`);
    return out(setupFinishedResult(msg.id));
  }
  // The host's initialize is forwarded as-is EXCEPT for the compat field we add — this is the handshake the
  // server actually sees in normal operation (the promotion handshake only happens after an absent spell).
  // `msg` itself stays untouched: the degrade path below replays the host's original message.
  const outgoing = msg.method === 'initialize' ? { ...msg, params: withCompatMajor(msg.params) } : msg;
  for (let attempt = 1; attempt <= REQUEST_MAX_RETRIES; attempt++) {
    try {
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
      if (sessionId) headers['Mcp-Session-Id'] = sessionId;
      const res = await fetch(MCP_URL, { method: 'POST', headers, body: JSON.stringify(outgoing) });
      const sid = res.headers.get('mcp-session-id'); if (sid) sessionId = sid;
      const ct = res.headers.get('content-type') || '';
      const writeJson = (json) => {
        if (!json.trim()) return;
        if (msg.method === 'initialize') checkVersion(json);
        process.stdout.write(json + '\n');
      };
      if (ct.includes('text/event-stream')) {
        const text = await res.text();
        for (const block of text.split('\n\n')) for (const ln of block.split('\n'))
          if (ln.startsWith('data: ')) writeJson(ln.slice(6));
      } else if (ct.includes('application/json')) {
        writeJson(await res.text());
      } else if (res.status !== 202 && res.status !== 204) {
        log(`unexpected response ${res.status}`);
      }
      return;
    } catch (err) {
      const retriable = err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.cause?.code === 'ECONNREFUSED';
      if (retriable && attempt < REQUEST_MAX_RETRIES) { await new Promise(r => setTimeout(r, REQUEST_RETRY_MS)); continue; }
      // Service went away mid-session -> degrade gracefully instead of crashing.
      // (The absent-mode re-probe loop will promote us back when it returns.)
      log(`forward failed (${err.message}); degrading to onboarding`);
      mode = 'absent';
      sessionId = null;
      return handleAbsent(msg);
    }
  }
}

// Read the server version from the initialize result; warn (don't fail) on MAJOR mismatch.
function checkVersion(jsonText) {
  try {
    const v = JSON.parse(jsonText)?.result?.serverInfo?.version;
    if (!v) return;
    serverVersion = v;
    const verdict = compat(v);
    if (verdict === 'ok') return;
    // Neither branch instructs an action the reader may be unable to take. "Update the plugin" was such an
    // instruction: it fires when the server is ahead, which is exactly when a newer plugin might not exist yet.
    const hint = verdict === 'server-too-old'
      ? `The installed MCP server (v${v}) is older than this plugin supports (major ${COMPAT_MIN_MAJOR} or later). If an update is available, updating the MCP server is the fix.`
      : verdict === 'server-newer'
      ? `The installed MCP server (v${v}) has a newer major version than this plugin was built against (major ${COMPAT_MIN_MAJOR}). Continuing anyway; nothing is known to be wrong. If something misbehaves, check for a plugin update.`
      : `Could not verify the MCP server version (${v}).`;
    log(`VERSION ${verdict}: ${hint}`);
    // Surface to the client as an MCP log notification (best-effort, non-fatal — forwarding continues).
    out({ jsonrpc: '2.0', method: 'notifications/message',
          params: { level: 'warning', logger: 'mcp-proxy', data: hint } });
  } catch { /* ignore parse issues */ }
}

// --- main ---
const reachable = await probeServer();
mode = reachable ? 'forward' : 'absent';
log(`mode=${mode} url=${MCP_URL}`);

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let msg; try { msg = JSON.parse(line); } catch { log(`invalid JSON: ${line}`); return; }
  if (mode === 'forward') await handleForward(msg);
  else await handleAbsent(msg);
});

// --- saying goodbye ---
// An ordinary shutdown (the host closes stdin, or a signal arrives) ends the session RIGHT NOW instead of
// leaving the server to expire it on its inactivity timeout. That matters beyond tidiness: the server derives
// its effective plugin-compat answer from the sessions it still counts, so a session nobody released keeps
// voting for an hour — and a user who restarts the host a few times an hour can hold a rolling population of
// those, making the pessimistic answer permanent without any single ghost being permanent.
// A killed process cannot say anything, so the server's timeout stays the backstop for that case.
let saidGoodbye = false;
async function sayGoodbye() {
  if (saidGoodbye) return;
  saidGoodbye = true;
  const sid = sessionId;
  if (!sid) return;   // never handshaked, or degraded to onboarding: there is no session to release
  try {
    await fetch(MCP_URL, { method: 'DELETE', headers: { 'Mcp-Session-Id': sid },
                           signal: AbortSignal.timeout(GOODBYE_TIMEOUT_MS) });
    log('session released');
  } catch (err) {
    // The service may already be stopping, or slower than the budget. Never delay the host's shutdown for it.
    log(`goodbye not delivered (${err.message}); the server will expire the session instead`);
  }
}
const shutdown = async () => { await sayGoodbye(); process.exit(0); };
rl.on('close', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
log(`thin proxy started -> ${MCP_URL}`);
