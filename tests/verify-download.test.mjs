/**
 * The one branch of the guided install that CANNOT be fired from outside.
 *
 * Verification on a real machine reached the two "no checksum readable" refusals and found the comparison itself
 * as unreachable: the expected digest is read from the API entry of the same release object the bytes come from, so
 * making the two disagree requires controlling the release host or terminating TLS with a trusted certificate. Both
 * change the machine rather than test the tool.
 *
 * So the comparison is fired here, with two values passed directly. Nothing in the shipped path lets a caller supply
 * the expected digest, and nothing here asks it to: this calls the same function the proxy calls, on real files.
 *
 * Run: node --test tests/verify-download.test.mjs
 *
 * Name the FILE. Measured here (node v24, Git Bash on Windows): `node --test tests/` reports `tests 1 / fail 1` with
 * the failure at `tests:1:1` - it took the directory for a test file. That red says nothing about the code, and it is
 * the shape a false verdict comes in: red for a reason that is not the subject.
 *
 * Control fired 2026-08-13, not assumed: forcing the comparison to pass turned both branch tests red (exit 1) while
 * the positive case stayed green - so the branch is carried by the two that failed, and the file was restored
 * byte-identical afterwards.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import { verifyOrDiscard } from '../noname-mcp/proxy/verify-download.mjs';

const BYTES = Buffer.from('pretend installer bytes');
const DIGEST = createHash('sha256').update(BYTES).digest('hex');

async function plant(name) {
  const dir = await mkdtemp(join(tmpdir(), 'noname-verify-'));
  const path = join(dir, name);
  await writeFile(path, BYTES);
  return path;
}

const gone = async (path) => {
  try { await stat(path); return false; } catch { return true; }
};

test('a matching digest passes AND leaves the file in place to be executed', async () => {
  const path = await plant('match.exe');
  const verdict = await verifyOrDiscard(path, DIGEST);

  assert.equal(verdict.ok, true);
  assert.equal(verdict.discarded, false);
  // The positive case has to assert the file SURVIVES. Without it, a function that deleted unconditionally would pass
  // the mismatch test below and break every real install - the failure would be invisible here and total in the field.
  assert.equal(await gone(path), false, 'a verified installer must still be there to run');
});

test('a mismatched digest refuses AND the file is gone', async () => {
  const path = await plant('mismatch.exe');
  const wrong = 'f'.repeat(64);
  assert.notEqual(wrong, DIGEST);

  const verdict = await verifyOrDiscard(path, wrong);

  // Three facts, because a refusal is made of all three and a returned flag alone is also what a function that ran
  // the installer and then complained would produce. Execution is the caller's step and never happens on !ok.
  assert.equal(verdict.ok, false);
  assert.equal(verdict.discarded, true);
  assert.equal(await gone(path), true, 'a mismatched installer must not be left on disk for someone to run later');
  assert.equal(verdict.actual, DIGEST, 'the reported digest is what the bytes hash to, not what was expected');
});

test('the digest is computed from the BYTES, so touching them changes the verdict', async () => {
  // Guards the tautology: a comparison that hashed nothing, or hashed a constant, would pass both tests above.
  const path = await plant('tampered.exe');
  await writeFile(path, Buffer.concat([BYTES, Buffer.from('!')]));

  const verdict = await verifyOrDiscard(path, DIGEST);

  assert.equal(verdict.ok, false, 'one appended byte must be enough to refuse');
  assert.notEqual(verdict.actual, DIGEST);
});
