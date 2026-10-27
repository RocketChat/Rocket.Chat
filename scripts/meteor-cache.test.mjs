import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const fixture = (t) => {
	const root = mkdtempSync(join(tmpdir(), 'meteor cache '));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	mkdirSync(join(root, 'scripts'));
	const script = join(root, 'scripts/meteor-cache.sh');
	copyFileSync(new URL('./meteor-cache.sh', import.meta.url), script);
	const local = join(root, 'apps/meteor/.meteor/local');
	const run = (args = [], env = {}) => spawnSync('bash', [script, ...args], { cwd: tmpdir(), env: { ...process.env, ...env }, encoding: 'utf8' });
	return { root, local, run };
};

test('measures without deleting and cleans only generated build files when requested', (t) => {
	const { local, run } = fixture(t);
	const caches = ['build', 'bundler-cache', 'isopacks', 'plugin-cache', 'server-cache', '.build123.build', '.build456.build.old-789'];
	for (const name of [...caches, 'db', 'shell', 'types', 'unrelated']) {
		mkdirSync(join(local, name), { recursive: true });
		writeFileSync(join(local, name, 'keep'), 'fixture data');
	}
	const measured = run();
	assert.equal(measured.status, 0, measured.stderr);
	assert.match(measured.stdout, /Meteor bundle cache: (?!0\.00 GB \(0 KiB\))/);
	for (const name of caches) assert.equal(existsSync(join(local, name, 'keep')), true);
	assert.equal(run(['--clean']).status, 0);
	for (const name of caches) assert.equal(existsSync(join(local, name)), false);
	for (const name of ['db', 'shell', 'types', 'unrelated']) assert.equal(readFileSync(join(local, name, 'keep'), 'utf8'), 'fixture data');
});

test('handles a checkout without a cache and rejects unknown cleanup options', (t) => {
	const { local, run } = fixture(t);
	assert.equal(run().status, 0);
	assert.equal(existsSync(local), false);
	assert.equal(run(['--clean']).status, 0);
	mkdirSync(join(local, 'build'), { recursive: true });
	assert.equal(run(['--unknown']).status, 2);
	assert.equal(run(['--clean', '--unknown']).status, 2);
	assert.equal(existsSync(join(local, 'build')), true);
});

test('recommends cleanup only when disk usage exceeds 5 GB', (t) => {
	const { root, local, run } = fixture(t);
	mkdirSync(join(local, 'build'), { recursive: true });
	const bin = join(root, 'bin');
	mkdirSync(bin);
	writeFileSync(join(bin, 'du'), '#!/bin/sh\nprintf "%s\\t%s\\n" "$CACHE_TEST_KIB" "$2"\n', { mode: 0o755 });
	const env = { PATH: `${bin}:${process.env.PATH}` };
	const below = run([], { ...env, CACHE_TEST_KIB: '4882812' });
	assert.equal(below.status, 0, below.stderr);
	assert.doesNotMatch(below.stdout, /--clean/);
	const above = run([], { ...env, CACHE_TEST_KIB: '4882813' });
	assert.equal(above.status, 0, above.stderr);
	assert.match(above.stdout, /exceeds 5 GB/);
	assert.match(above.stdout, /bash scripts\/meteor-cache\.sh --clean/);
	assert.equal(existsSync(join(local, 'build')), true);
});
