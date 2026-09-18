import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';

import { changedRanges, packageDirectory, planDiff } from './mutation-diff.mjs';
import { buildSummary, summaryExitCode } from './mutation-summary.mjs';

function repository(t) {
	const root = mkdtempSync(resolve(tmpdir(), 'mutation-diff-'));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
	const write = (file, content) => {
		mkdirSync(dirname(resolve(root, file)), { recursive: true });
		writeFileSync(resolve(root, file), content);
	};
	git('init', '-q');
	git('config', 'user.email', 'mutation-fixture@example.invalid');
	git('config', 'user.name', 'Mutation fixture');
	git('config', 'commit.gpgsign', 'false');
	git('config', 'core.hooksPath', '/dev/null');
	write('package.json', JSON.stringify({ workspaces: ['packages/*', 'ee/packages/*', 'apps/*'] }));
	write('.gitignore', 'ignored.ts\n');
	for (const pkg of ['packages/first', 'ee/packages/second']) {
		write(`${pkg}/package.json`, '{}');
		write(`${pkg}/jest.config.ts`, 'export default {};');
	}
	write('packages/first/src/value.ts', 'export const first = 1;\n\n\n\n\nexport const last = 2;\n');
	write('packages/first/src/deleted.ts', 'export const deleted = true;\n');
	write('packages/first/src/moved.ts', 'export const moved = true;\n');
	write('packages/first/src/deletionOnly.ts', 'export const keep = 1;\nexport const remove = 2;\n');
	git('add', '.');
	git('commit', '-qm', 'Fixture baseline');
	git('branch', 'base');
	return { root, git, write };
}

test('diff plans committed, staged, unstaged and untracked changes against the merge base', (t) => {
	const { root, git, write } = repository(t);
	write('packages/first/src/value.ts', 'export const first = 10;\n\n\n\n\nexport const last = 2;\n');
	git('add', '.');
	git('commit', '-qm', 'Fixture branch change');
	write('ee/packages/second/src/staged.ts', 'export const staged = 1;\n');
	git('add', '.');
	write('packages/first/src/value.ts', 'export const first = 10;\n\n\n\n\nexport const last = 20;\n');
	write('packages/first/src/new file.ts', 'export const fresh = true;\n');
	write('packages/first/src/ignored.ts', 'export const ignored = true;\n');
	const before = git('status', '--porcelain');
	git('config', 'color.ui', 'always');
	git('config', 'diff.interHunkContext', '100');
	const plan = planDiff(root, 'base');
	assert.deepEqual(plan.jobs, [
		{ packagePath: 'ee/packages/second', targets: ['src/staged.ts:1-1'] },
		{ packagePath: 'packages/first', targets: ['src/new file.ts', 'src/value.ts:1-1', 'src/value.ts:6-6'] },
	]);
	assert.equal(git('status', '--porcelain'), before);
	assert.equal(readFileSync(resolve(root, 'packages/first/src/value.ts'), 'utf8').includes('last = 20'), true);
});

test('diff checks renamed files and reports deletions, excluded files, and unsupported packages', (t) => {
	const { root, write } = repository(t);
	renameSync(resolve(root, 'packages/first/src/moved.ts'), resolve(root, 'ee/packages/second/moved.ts'));
	rmSync(resolve(root, 'packages/first/src/deleted.ts'));
	write('packages/first/src/deletionOnly.ts', 'export const keep = 1;\n');
	write('packages/first/src/value.spec.ts', 'test("example", () => {});');
	write('packages/first/src/types.d.ts', 'declare const a: string;');
	write('packages/first/src/__mocks__/data.ts', 'export const data = 1;');
	write('packages/no-jest/package.json', '{}');
	write('packages/no-jest/src/a.ts', 'export const a = 1;');
	write('scripts/a.ts', 'export const a = 1;');
	symlinkSync(resolve(root, 'packages/first/src/value.ts'), resolve(root, 'packages/first/src/link.ts'));
	const { jobs, skipped } = planDiff(root, 'base');
	assert.deepEqual(jobs, [{ packagePath: 'ee/packages/second', targets: ['moved.ts'] }]);
	assert.equal(skipped.length, 10);
	assert.match(skipped.find(({ file }) => file.endsWith('deletionOnly.ts')).reason, /deletion-only/);
	assert.match(skipped.find(({ file }) => file.endsWith('deleted.ts')).reason, /deleted/);
	assert.match(skipped.find(({ file }) => file.includes('no-jest/src')).reason, /no jest/);
});

test('source filtering preserves production names while excluding explicit test and tooling conventions', (t) => {
	const { root, write } = repository(t);
	const sources = ['src/setup.ts', 'src/config.ts', 'src/reports/utils/round.ts', 'src/build/index.ts', 'src/generated/index.ts'];
	const excluded = [
		'src/value.test.js',
		'src/value.spec.ts',
		'src/value.stories.tsx',
		'src/types.d.ts',
		'webpack.config.js',
		'src/__tests__/value.ts',
		'src/__mocks__/value.ts',
		'tests/value.ts',
		'dist/value.js',
		'coverage/value.js',
		'migrations/value.ts',
	];
	for (const file of [...sources, ...excluded]) write(`packages/first/${file}`, 'export const value = 1;');
	const { jobs, skipped } = planDiff(root, 'base');
	assert.deepEqual(jobs, [{ packagePath: 'packages/first', targets: [...sources].sort() }]);
	assert.deepEqual(skipped.map(({ file }) => file).sort(), excluded.map((file) => `packages/first/${file}`).sort());
});

test('comparison excludes independent base-branch changes', (t) => {
	const { root, git, write } = repository(t);
	git('checkout', '-qb', 'feature');
	write('packages/first/src/feature.ts', 'export const feature = 1;');
	git('add', '.');
	git('commit', '-qm', 'Fixture feature');
	git('checkout', '-q', 'base');
	write('packages/first/src/baseOnly.ts', 'export const baseOnly = 1;');
	git('add', '.');
	git('commit', '-qm', 'Fixture base advance');
	git('checkout', '-q', 'feature');
	assert.deepEqual(planDiff(root, 'base').jobs, [{ packagePath: 'packages/first', targets: ['src/feature.ts:1-1'] }]);
});

test('invalid bases and filenames fail explicitly; empty changes produce no jobs', (t) => {
	const { root, write } = repository(t);
	assert.deepEqual(planDiff(root, 'base').jobs, []);
	assert.throws(() => planDiff(root, 'missing-base'), /Cannot find a merge base/);
	write('packages/first/src/a,b.ts', 'export const comma = 1;');
	assert.throws(() => planDiff(root, 'base'), /Cannot safely express/);
	assert.throws(() => packageDirectory(root, '..'), /inside this repository/);
});

test('hunk selection handles zero-length deletions, omitted counts, and multiple ranges', () => {
	assert.deepEqual(changedRanges('@@ -1 +1 @@\n-a\n+b\n@@ -5,2 +5,0 @@\n-x\n-y\n@@ -10,0 +9,3 @@\n+a\n+b\n+c'), ['1-1', '9-11']);
});

const location = { start: { line: 1, column: 1 }, end: { line: 1, column: 2 } };
function reportFor(statuses) {
	return {
		testFiles: { 'src/a.spec.ts': { tests: [{ id: 'test-1', name: 'checks a boundary' }] } },
		files: {
			'src/a.ts': {
				source: 'a > 0',
				mutants: statuses.map((status, index) => ({
					id: String(index),
					status,
					location,
					mutatorName: 'EqualityOperator',
					replacement: 'b',
					coveredBy: ['test-1'],
					statusReason: 'Equivalent behavior',
				})),
			},
		},
	};
}
const complete = { packagePath: 'packages/example', completion: 'complete', exitCode: 0 };

test('summary identifies surviving behavior and covering tests, excluding ignored and invalid mutants from score', () => {
	const summary = buildSummary(reportFor(['Killed', 'Timeout', 'Survived', 'NoCoverage', 'Ignored', 'CompileError']), complete);
	assert.equal(summary.score, 50);
	assert.equal(summary.status, 'complete');
	assert.equal(summaryExitCode(summary), 0);
	assert.equal(summary.survivors.length, 2);
	assert.equal(summary.survivors[0].original, 'a');
	assert.equal(summary.survivors[0].replacement, 'b');
	assert.equal(summary.survivors[0].coveringTests[0].name, 'checks a boundary');
	assert.equal(summary.ignored[0].reason, 'Equivalent behavior');
});

test('summary extracts single-line and multiline source using one-based report columns', () => {
	const report = reportFor(['Survived']);
	const file = report.files['src/a.ts'];
	file.source = 'return true;';
	file.mutants[0].location = { start: { line: 1, column: 8 }, end: { line: 1, column: 12 } };
	assert.equal(buildSummary(report, complete).survivors[0].original, 'true');
	file.source = 'return [\n  first,\n  second\n];';
	file.mutants[0].location = { start: { line: 1, column: 8 }, end: { line: 4, column: 2 } };
	assert.equal(buildSummary(report, complete).survivors[0].original, '[\n  first,\n  second\n]');
});

test('a threshold failure is distinct from failed, interrupted, incomplete and dry-only runs', () => {
	assert.equal(summaryExitCode(buildSummary(reportFor(['Killed', 'Survived']), { ...complete, minScore: 80 })), 1);
	assert.equal(summaryExitCode(buildSummary(reportFor(['Killed']), { ...complete, minScore: 100 })), 0);
	for (const overrides of [{ completion: 'failed', exitCode: 3 }, { completion: undefined }, { exitCode: 1 }]) {
		const summary = buildSummary(reportFor(['Killed']), { ...complete, ...overrides, minScore: 0 });
		assert.equal(summary.status, 'incomplete');
		assert.equal(summaryExitCode(summary), 3);
	}
	for (const status of ['Pending', 'RuntimeError', 'Unknown']) {
		assert.equal(summaryExitCode(buildSummary(reportFor([status]), complete)), 3);
	}
	assert.equal(summaryExitCode(buildSummary(null, { ...complete, completion: 'failed', exitCode: 3 })), 3);
	assert.equal(summaryExitCode(buildSummary(null, { ...complete, signal: 'SIGTERM' })), 143);
	const dry = buildSummary(null, { ...complete, completion: 'dry-run' });
	assert.equal(dry.status, 'dry-run');
	assert.equal(dry.score, null);
	assert.equal(summaryExitCode(dry), 0);
});

test('an empty or fully ignored selection has no score and cannot satisfy an enabled gate', () => {
	for (const statuses of [[], ['Ignored'], ['CompileError']]) {
		const summary = buildSummary(reportFor(statuses), { ...complete, minScore: 0 });
		assert.equal(summary.status, 'no-mutants');
		assert.equal(summary.score, null);
		assert.equal(summaryExitCode(summary), 1);
	}
});
