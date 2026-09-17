import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const clientConfig = `
import client from '@rocket.chat/jest-presets/client';
export default {
	preset: client.preset,
	moduleNameMapper: {
		'^react$': '<rootDir>/../../node_modules/react',
		'^local$': '<rootDir>/src/isPositive.ts',
	},
};
`;

async function fixture(t, config = clientConfig) {
	const temporaryRoot = resolve(root, '.stryker-tmp');
	await mkdir(temporaryRoot, { recursive: true });
	const directory = await mkdtemp(resolve(temporaryRoot, 'tooling-test-'));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const files = {
		'package.json': JSON.stringify({ name: 'mutation-tooling-fixture', private: true }),
		'jest.config.ts': config,
		'src/isPositive.ts': 'export const isPositive = (value: number) => value > 0;',
		'src/isPositive.spec.ts': `
import { createElement } from 'react';
import { isPositive } from 'local';
test.each([-1, 0, 1])('checks the boundary for %s', (value) => {
	expect(isPositive(value)).toBe(value === 1);
	expect(createElement('div').type).toBe('div');
	expect(document.createElement('div').tagName).toBe('DIV');
});
`,
	};
	await Promise.all(
		Object.entries(files).map(async ([name, content]) => {
			const path = resolve(directory, name);
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, content);
		}),
	);
	return directory;
}

function run(directory, ...args) {
	return exec(process.execPath, ['scripts/run-mutation-tests.mjs', relative(root, directory), '--cleanTempDir', 'always', ...args], {
		cwd: root,
		timeout: 60_000,
	});
}

test('preserves preset jsdom and external aliases while local aliases exercise mutants', async (t) => {
	const directory = await fixture(t);
	await run(directory, '--mutate', 'src/isPositive.ts');
	const report = JSON.parse(await readFile(resolve(directory, 'reports/mutation/mutation.json'), 'utf8'));
	const { mutants } = report.files['src/isPositive.ts'];
	assert.ok(mutants.length > 0);
	assert.ok(
		mutants.every(({ status }) => status === 'Killed'),
		JSON.stringify(mutants),
	);
});

for (const scope of ['src/missing.ts', 'src/isPositive.ts,!src/isPositive.ts']) {
	test(`rejects an empty selection before tests run: ${scope}`, async (t) => {
		const directory = await fixture(t);
		await assert.rejects(run(directory, '--mutate', scope, '--dryRunOnly'), (error) => {
			assert.equal(error.code, 1);
			assert.match(error.stdout + error.stderr, /No production files matched the mutation scope/);
			assert.doesNotMatch(error.stdout, /Starting initial test run/);
			return true;
		});
	});
}

test('rejects multi-project Jest configurations explicitly', async (t) => {
	const directory = await fixture(
		t,
		`export default { projects: [{ displayName: 'one', rootDir: '.' }, { displayName: 'two', rootDir: '.' }] };`,
	);
	await assert.rejects(run(directory, '--mutate', 'src/isPositive.ts', '--dryRunOnly'), (error) => {
		assert.equal(error.code, 1);
		assert.match(error.stdout + error.stderr, /Multi-project configurations need a dedicated setup/);
		return true;
	});
});
