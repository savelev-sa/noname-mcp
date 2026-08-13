/**
 * Compare a downloaded installer against the checksum published with its release, and DISCARD it on mismatch.
 *
 * WHY THIS IS ITS OWN FILE, and it is the only reason: the branch that refuses could not be fired from outside.
 * The expected digest is read from the API entry of the SAME release object the bytes come from, so the two cannot be
 * made to disagree without controlling the release host or terminating TLS on the machine with a certificate it
 * trusts. That is a property worth keeping — a digest published beside the download certifies nothing about it — and
 * its consequence is that end-to-end testing exercises "no checksum readable", never the comparison.
 *
 * A check nobody has seen fail is not a check. So the mechanism lives here, where a test can call it with two values
 * directly, and the shipped path is unchanged: nothing lets a CALLER supply the expected digest, because a test-only
 * override of the expected value is a bypass with a friendly name — it ships in the binary, and every argument for
 * having it in a test is available to someone in a hurry.
 *
 * The consequences are part of the unit deliberately. Returning a boolean would leave "and the file is deleted" and
 * "and it is not executed" as the caller's promise, and those are the two facts a refusal is actually made of.
 */

import { createHash } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';

/**
 * @param path      where the downloaded installer sits
 * @param expected  lowercase hex sha256 published with the release
 * @param io        injected only so a test can watch the delete; the default IS the real filesystem, so the shipped
 *                  path takes no branch that a test could have moved (same shape as agent-detect.mjs)
 * @returns {{ok: boolean, actual: string, discarded: boolean}}
 */
export async function verifyOrDiscard(path, expected, io = { readFile, unlink }) {
  const actual = createHash('sha256').update(await io.readFile(path)).digest('hex');
  if (actual === expected) return { ok: true, actual, discarded: false };

  // Deleted BEFORE returning, not by the caller: a mismatched installer left on disk is a file someone runs later,
  // and by then nothing is comparing it to anything.
  await io.unlink(path).catch(() => {});
  return { ok: false, actual, discarded: true };
}
