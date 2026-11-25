import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { SUITES, buildMap, changesOnlyTypes, ciOutputs, selectSpecs, toRepoPath } from './impact.mts';
import { packageImpact, parseModule } from './packages.mts';

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
	write('omnichannel/chat.spec.ts', { 'client/chat.ts': { f: { 0: 3 } }, 'client/admin.ts': { f: { 0: 0 } } });
	write('admin.spec.ts', { 'client/admin.ts': { path: 'client/admin.ts', f: { 0: 1 } } });
	writeFileSync(path.join(dir, `playwright_coverage_${randomUUID()}.json`), '{}');
	writeFileSync(
		path.join(dir, `server_coverage_${encodeURIComponent('admin.spec.ts')}_${randomUUID()}.json`),
		JSON.stringify(['/app/bundle/apps/meteor/server/methods/saveSettings.ts']),
	);

	const fragment = path.join(dir, 'fragment.json');
	writeFileSync(
		fragment,
		JSON.stringify({ files: ['apps/meteor/client/other.ts'], specs: { 'apps/meteor/tests/e2e/other.spec.ts': [0] } }),
	);

	const map = buildMap([dir, fragment]);
	const files = (spec: string) => map.specs[`apps/meteor/tests/e2e/${spec}`].map((i) => map.files[i]);

	assert.deepEqual(map.files, [
		'apps/meteor/client/admin.ts',
		'apps/meteor/client/chat.ts',
		'apps/meteor/client/other.ts',
		'apps/meteor/server/methods/saveSettings.ts',
	]);
	assert.deepEqual(files('omnichannel/chat.spec.ts'), ['apps/meteor/client/chat.ts']);
	assert.deepEqual(files('admin.spec.ts'), ['apps/meteor/client/admin.ts', 'apps/meteor/server/methods/saveSettings.ts']);
	assert.deepEqual(selectSpecs(map, ['apps/meteor/server/methods/saveSettings.ts'], []).specs, ['apps/meteor/tests/e2e/admin.spec.ts']);
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
		skip: false,
		reasons: [],
		specs: ['apps/meteor/tests/e2e/bypass.spec.ts', 'apps/meteor/tests/e2e/chat.spec.ts'],
	});
	assert.deepEqual(
		selectSpecs(map, ['apps/meteor/tests/e2e/new.spec.ts', 'apps/meteor/client/x.spec.tsx', 'apps/meteor/client/x.stories.tsx'], []).specs,
		['apps/meteor/tests/e2e/new.spec.ts'],
	);
	assert.equal(selectSpecs(map, ['apps/meteor/server/methods.ts'], always).all, true);
	assert.equal(selectSpecs(map, ['apps/meteor/tests/e2e/page-objects/home.ts'], always).all, true);
	assert.equal(selectSpecs(map, ['yarn.lock'], always).all, true);
	assert.equal(selectSpecs(map, ['apps/meteor/client/dead.ts'], always).all, true);
	assert.equal(
		selectSpecs(map, ['docs/x.md', 'apps/meteor/tests/end-to-end/api/x.ts', '.oxlintrc.json', 'packages/ui/.prettierrc'], always).skip,
		true,
	);
});

void test('treats a change that leaves the JavaScript the same as type-only', () => {
	const before = 'export interface IUser { name: string }\nexport const limit = 10;\n';
	assert.equal(changesOnlyTypes('a.ts', before, 'export interface IUser { name: string; bio?: string }\nexport const limit = 10;\n'), true);
	assert.equal(changesOnlyTypes('a.ts', before, 'export interface IUser { name: string }\nexport const limit = 20;\n'), false);
	assert.equal(changesOnlyTypes('a.ts', before, 'export enum Kind { A }\nexport const limit = 10;\n'), false);
	assert.equal(changesOnlyTypes('types.d.ts', undefined, undefined), true);
	assert.equal(changesOnlyTypes('a.tsx', before, before), false);
	assert.equal(changesOnlyTypes('new.ts', undefined, before), false);
});

void test('follows a package change, export by export, to the app files, the widget or a microservice', () => {
	const names = new Map([
		['apps/meteor', '@rocket.chat/meteor'],
		['packages/ui', '@rocket.chat/ui'],
		['packages/models', '@rocket.chat/models'],
		['packages/tool', '@rocket.chat/tool'],
		['packages/livechat', '@rocket.chat/livechat'],
		['ee/apps/presence', '@rocket.chat/presence'],
	]);
	const sources: Record<string, string> = {
		'packages/ui/src/index.ts': "export * from './components';\nexport { default as Text } from './Text';",
		'packages/ui/src/components/index.ts': "export { default as Button } from './Button';\nexport { Modal } from './Modal';",
		'packages/ui/src/components/Button.tsx': 'export default function Button() {}',
		'packages/ui/src/components/Modal.tsx': "import Backdrop from './Backdrop';\nexport const Modal = () => Backdrop;",
		'packages/ui/src/components/Backdrop.tsx': 'export default function Backdrop() {}',
		'packages/ui/src/Text.tsx': 'export default function Text() {}',
		'apps/meteor/client/Header.tsx': "import { Button } from '@rocket.chat/ui';",
		'apps/meteor/client/Dialog.tsx': "import { Modal, type ModalProps } from '@rocket.chat/ui';",
		'apps/meteor/client/Title.tsx': "import { Text } from '@rocket.chat/ui';",
		'packages/livechat/src/App.tsx': "import { Text } from '@rocket.chat/ui';",
		'packages/models/src/index.ts': "export { Users } from './Users';\nexport { Rooms } from './Rooms';",
		'packages/models/src/Users.ts': 'export const Users = {};',
		'packages/models/src/Rooms.ts': 'export const Rooms = {};',
		'ee/apps/presence/src/service.ts': "import { Users, Rooms } from '@rocket.chat/models';",
		'apps/meteor/server/users.ts': "import type { Users } from '@rocket.chat/models';",
		'apps/meteor/server/rooms.ts': "import { Rooms } from '@rocket.chat/models';",
		'packages/tool/index.ts': 'export const run = 1;',
	};
	const workspace = (file: string) => [...names.keys()].find((dir) => file.startsWith(`${dir}/`))!;
	const graph = {
		names,
		modules: new Map(Object.entries(sources).map(([file, content]) => [file, parseModule(workspace(file), content)])),
	};

	const backdrop = packageImpact(graph, ['packages/ui/src/components/Backdrop.tsx']);
	assert.deepEqual([backdrop.appFiles, backdrop.widget, backdrop.reasons], [['apps/meteor/client/Dialog.tsx'], false, []]);
	const text = packageImpact(graph, ['packages/ui/src/Text.tsx']);
	assert.deepEqual([text.appFiles, text.widget], [['apps/meteor/client/Title.tsx'], true]);
	assert.deepEqual(packageImpact(graph, ['packages/models/src/Users.ts']).reasons, [
		'only microservices import what changed: ee/apps/presence',
	]);
	const rooms = packageImpact(graph, ['packages/models/src/Rooms.ts']);
	assert.deepEqual([rooms.appFiles, rooms.reasons], [['apps/meteor/server/rooms.ts'], []]);
	assert.match(packageImpact(graph, ['packages/tool/index.ts']).reasons[0], /no app or widget imports/);
	assert.deepEqual(packageImpact(graph, ['packages/ui/package.json']).reasons, ['dependencies changed: packages/ui/package.json']);

	const map = { files: ['apps/meteor/client/Title.tsx'], specs: { 'apps/meteor/tests/e2e/title.spec.ts': [0] } };
	const viaPackages = { appFiles: text.appFiles, specs: ['apps/meteor/tests/e2e/omnichannel/livechat.spec.ts'], reasons: [] };
	assert.deepEqual(selectSpecs(map, ['packages/ui/src/Text.tsx'], [], viaPackages).specs, [
		'apps/meteor/tests/e2e/omnichannel/livechat.spec.ts',
		'apps/meteor/tests/e2e/title.spec.ts',
	]);
	assert.equal(
		selectSpecs(map, ['packages/ui/src/Text.tsx'], [], { appFiles: ['apps/meteor/client/Unused.tsx'], specs: [], reasons: [] }).all,
		true,
	);
});

void test('selects API test files by the server code they run and skips them for client-only changes', () => {
	const map = {
		files: ['apps/meteor/server/api/v1/chat.ts', 'apps/meteor/client/Chat.tsx'],
		specs: { 'apps/meteor/tests/end-to-end/api/chat.ts': [0], 'apps/meteor/tests/e2e/chat.spec.ts': [0, 1] },
	};
	const none = { appFiles: [], specs: [], reasons: [] };
	const api = (changed: string[], viaPackages = none) => selectSpecs(map, changed, [], viaPackages, SUITES.api);

	assert.deepEqual(api(['apps/meteor/server/api/v1/chat.ts']).specs, ['apps/meteor/tests/end-to-end/api/chat.ts']);
	assert.equal(api(['apps/meteor/client/Chat.tsx', 'apps/meteor/tests/e2e/chat.spec.ts']).skip, true);
	assert.deepEqual(api(['apps/meteor/tests/end-to-end/api/rooms.ts']).specs, ['apps/meteor/tests/end-to-end/api/rooms.ts']);
	assert.equal(api(['apps/meteor/tests/data/api-data.ts']).all, true);
	assert.equal(api(['packages/ui/src/Text.tsx'], { appFiles: ['apps/meteor/client/Chat.tsx'], specs: [], reasons: [] }).skip, true);
	assert.deepEqual(api(['packages/rest/src/chat.ts'], { appFiles: ['apps/meteor/server/api/v1/chat.ts'], specs: [], reasons: [] }).specs, [
		'apps/meteor/tests/end-to-end/api/chat.ts',
	]);
	assert.equal(selectSpecs(map, ['apps/meteor/tests/end-to-end/api/rooms.ts'], [], none, SUITES.ui).skip, true);
});

void test('turns the selections into the ci.yml job outputs', () => {
	const selection = (specs: string[], extra = {}) => ({ all: false, skip: false, reasons: [], specs, ...extra });
	const ui = Array.from({ length: 16 }, (_, i) => `apps/meteor/tests/e2e/s${i}.spec.ts`);

	assert.deepEqual(
		ciOutputs({
			'ui': selection(ui),
			'api': selection([], { skip: true }),
			'api-livechat': selection(['apps/meteor/tests/end-to-end/api-livechat/a.ts'], { all: true }),
		}),
		{
			'specs': ui.map((spec) => spec.replace('apps/meteor/', '')).join(' '),
			'skip': 'false',
			'api-specs': '',
			'api-skip': 'true',
			'api-livechat-specs': '',
			'api-livechat-skip': 'false',
			'total-shard': '2',
			'shards': '[1,2]',
		},
	);
	const many = Array.from({ length: 46 }, (_, i) => `s${i}.spec.ts`);
	assert.equal(ciOutputs({ ui: selection(many) }).shards, undefined);
	assert.equal(ciOutputs({ ui: selection([], { all: true }) }).shards, undefined);
});
