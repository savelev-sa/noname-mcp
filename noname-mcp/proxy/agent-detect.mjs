/**
 * Is the BACKUP AGENT — the product this plugin manages — installed on this machine?
 *
 * The signal is the CLI EXECUTABLE, never a directory. The product deliberately leaves its data directory
 * (settings, database, logs) behind when it is uninstalled, so "directory exists" reports the product as
 * present forever on any machine where it was ever installed. Measured on a clean test machine: after the
 * agent's own uninstaller had run and cbb.exe was gone, the data directory was still there with 8 items —
 * and onboarding told the user the backup software was installed, on exactly the machine onboarding exists
 * to fix.
 *
 * cbb.exe is also precisely what the MCP server needs in order to drive the product, so keying off it keeps
 * the two layers' answers aligned: the server resolves the install directory from the registry, then requires
 * cbb.exe inside it.
 */
import { existsSync } from 'node:fs';

const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';

/** Default install directories — the same fallback list the server-side detector uses. */
export const AGENT_INSTALL_DIRS = [
  `${programFiles}\\MSP360\\Managed Backup`,
  `${programFiles}\\CloudBerryLab\\CloudBerry Backup`,
];

/** The CLI executable whose presence proves the product is installed AND drivable. */
export const AGENT_EXE = 'cbb.exe';

/**
 * True when the agent's CLI executable is present in one of the candidate directories.
 * `exists` is injectable so the rule can be exercised against simulated filesystem states.
 */
export function agentInstalled(exists = existsSync) {
  try {
    return AGENT_INSTALL_DIRS.some(dir => exists(`${dir}\\${AGENT_EXE}`));
  } catch {
    return false;
  }
}
