import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildMap, selectSpecs, toRepoPath } from './impact.mts';

void test('toRepoPath normalizes absolute and app-relative paths', () => {
	assert.equal(toRepoPath('/home/runner/work/Rocket.Chat/Rocket.Chat/apps/meteor/client/a.ts'), 'apps/meteor/client/a.ts');
	assert.equal(toRepoPath('ee/server/b.ts'), 'apps/meteor/ee/server/b.ts');
	assert.equal(toRepoPath('packages/rocketchat-i18n/i18n.js'), 'apps/meteor/packages/rocketchat-i18n/i18n.js');
	assert.equal(toRepoPath('node_modules/@rocket.chat/license/src/index.ts'), undefined);
	assert.equal(toRepoPath('/app/node_modules/react/index.js'), undefined);
});

void test('builds a per-spec map and merges shard fragments', () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'impact-'));
	const write = (spec: string, coverage: object) =>
		writeFileSync(path.join(dir, `playwright_coverage_${encodeURIComponent(spec)}_${randomUUID()}.json`), JSON.stringify(coverage));
	write('omnichannel/chat.spec.ts', { 'client/chat.ts': { s: { 0: 3 } }, 'client/admin.ts': { s: { 0: 0 } } });
	write('admin.spec.ts', { 'client/admin.ts': { path: 'client/admin.ts', s: { 0: 1 } } });
	writeFileSync(path.join(dir, `playwright_coverage_${randomUUID()}.json`), '{}');

	const fragment = path.join(dir, 'fragment.json');
	writeFileSync(
		fragment,
		JSON.stringify({ files: ['apps/meteor/client/other.ts'], specs: { 'apps/meteor/tests/e2e/other.spec.ts': [0] } }),
	);

	const map = buildMap([dir, fragment]);
	const files = (spec: string) => map.specs[`apps/meteor/tests/e2e/${spec}`].map((i) => map.files[i]);

	assert.deepEqual(map.files, ['apps/meteor/client/admin.ts', 'apps/meteor/client/chat.ts', 'apps/meteor/client/other.ts']);
	assert.deepEqual(files('omnichannel/chat.spec.ts'), ['apps/meteor/client/chat.ts']);
	assert.deepEqual(files('admin.spec.ts'), ['apps/meteor/client/admin.ts']);
	assert.deepEqual(files('other.spec.ts'), ['apps/meteor/client/other.ts']);
});

void test('selects covering specs and falls back to the full suite on unknown changes', () => {
	const map = {
		files: ['apps/meteor/client/admin.ts', 'apps/meteor/client/chat.ts', 'apps/meteor/client/dead.ts'],
		specs: { 'apps/meteor/tests/e2e/admin.spec.ts': [0], 'apps/meteor/tests/e2e/chat.spec.ts': [0, 1] },
	};
	const always = ['apps/meteor/tests/e2e/bypass.spec.ts'];

	assert.deepEqual(selectSpecs(map, ['apps/meteor/client/chat.ts', '.changeset/x.md'], always), {
		all: false,
		reasons: [],
		specs: ['apps/meteor/tests/e2e/bypass.spec.ts', 'apps/meteor/tests/e2e/chat.spec.ts'],
	});
	assert.deepEqual(
		selectSpecs(map, ['apps/meteor/client/dead.ts', 'apps/meteor/tests/e2e/new.spec.ts', 'apps/meteor/client/x.spec.tsx'], []).specs,
		['apps/meteor/tests/e2e/new.spec.ts'],
	);
	assert.equal(selectSpecs(map, ['apps/meteor/server/methods.ts'], always).all, true);
	assert.equal(selectSpecs(map, ['apps/meteor/tests/e2e/page-objects/home.ts'], always).all, true);
	assert.equal(selectSpecs(map, ['yarn.lock'], always).all, true);
});
