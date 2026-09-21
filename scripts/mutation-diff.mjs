import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, matchesGlob, relative, resolve, sep } from 'node:path';

export class UsageError extends Error {}
const slash = (path) => path.split(sep).join('/');
const runnerConfigs = { jest: 'jest.config.ts', mocha: '.mocharc.js' };

function packageRunners(directory) {
	return Object.entries(runnerConfigs)
		.filter(([, config]) => existsSync(resolve(directory, config)))
		.map(([runner]) => runner);
}

function workspacePatterns(root) {
	const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
	return manifest.workspaces?.packages ?? manifest.workspaces ?? [];
}

export function planExplicit(root, packagePath, scope) {
	root = realpathSync(root);
	const directory = resolve(root, packagePath);
	packagePath = slash(relative(root, directory));
	if (
		!packagePath ||
		packagePath.startsWith('../') ||
		isAbsolute(packagePath) ||
		!workspacePatterns(root).some((pattern) => matchesGlob(packagePath, pattern)) ||
		!existsSync(resolve(directory, 'package.json')) ||
		realpathSync(directory) !== directory
	) {
		throw new UsageError('Expected a workspace package directory inside this repository.');
	}
	const runners = packageRunners(directory);
	if (!runners.length) throw new UsageError(`${packagePath} has no jest.config.ts or .mocharc.js.`);
	// Match Stryker CLI's comma-separated scope; Stryker resolves globs, exclusions, and line ranges.
	const targets = scope.split(',').filter(Boolean);
	if (!targets.some((target) => !target.startsWith('!'))) throw new UsageError('--mutate requires a production source target.');
	for (const target of targets) {
		const path = target.replace(/^!/, '');
		if (isAbsolute(path) || path.includes('\\') || /^[A-Za-z]:/.test(path) || path.split('/').includes('..')) {
			throw new UsageError('--mutate paths must stay inside the selected package and use forward slashes.');
		}
	}
	return { jobs: runners.map((testRunner) => ({ packagePath, testRunner, targets })), skipped: [] };
}

export function changedRanges(diff) {
	return [...diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)]
		.map(([, start, count = '1']) => ({ start: Number(start), count: Number(count) }))
		.filter(({ count }) => count > 0)
		.map(({ start, count }) => `${start}-${start + count - 1}`);
}

const NON_SOURCE = [
	/\.d\.[cm]?ts$/,
	/\.(tests?|spec)\.[cm]?[jt]sx?$/,
	/(^|\/)__(tests|mocks)__\//,
	/\.stories\.[cm]?[jt]sx?$/,
	/\.config\.[cm]?[jt]s$/,
	/(^|\/)\.mocharc\./,
	/(^|\/)(dist|node_modules|coverage)\//,
	/(^|\/)tests?\//,
	/(^|\/)migrations\//,
];

function exclusion(file) {
	if (!/\.[cm]?[jt]sx?$/.test(file)) return 'not JavaScript or TypeScript';
	return NON_SOURCE.some((pattern) => pattern.test(file)) ? 'test, declaration, config, or excluded directory' : null;
}

export function planDiff(root, base = 'origin/develop') {
	root = realpathSync(root);
	const git = (...args) =>
		execFileSync('git', args, {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
			maxBuffer: 32 * 1024 * 1024,
			env: { ...process.env, GIT_LITERAL_PATHSPECS: '1' },
		});
	let mergeBase;
	try {
		const baseCommit = git('rev-parse', '--verify', '--end-of-options', `${base}^{commit}`).trim();
		mergeBase = git('merge-base', baseCommit, 'HEAD').trim();
	} catch {
		throw new UsageError(`Cannot find a merge base with ${base}. Run git fetch origin develop first.`);
	}
	const workspaces = workspacePatterns(root);
	const split = (output) => output.split('\0').filter(Boolean);
	// Renames are deletion + addition: check the moved file in its new package context.
	const tracked = split(git('diff', '--no-ext-diff', '--no-textconv', '--no-color', '--name-only', '-z', '--no-renames', mergeBase, '--'));
	const untracked = new Set(split(git('ls-files', '--others', '--exclude-standard', '-z')));
	const jobs = new Map();
	const skipped = [];
	for (const file of [...new Set([...tracked, ...untracked])].sort()) {
		const skip = (reason) => skipped.push({ file, reason });
		const reason = exclusion(file);
		if (reason) {
			skip(reason);
			continue;
		}
		const absolute = resolve(root, file);
		if (!existsSync(absolute)) {
			skip('deleted file');
			continue;
		}
		if (!lstatSync(absolute).isFile() || realpathSync(absolute) !== absolute) {
			skip('symlink or non-regular file');
			continue;
		}
		let directory = dirname(absolute);
		while (directory !== root && !existsSync(resolve(directory, 'package.json'))) directory = dirname(directory);
		const packagePath = slash(relative(root, directory));
		if (!workspaces.some((pattern) => matchesGlob(packagePath, pattern))) {
			skip('outside a root workspace package');
			continue;
		}
		const runners = packageRunners(directory);
		if (!runners.length) {
			skip('package has no jest.config.ts or .mocharc.js');
			continue;
		}
		const target = slash(relative(directory, absolute));
		if (/[,\n\r\\:*?{}[\]()!]/.test(target))
			throw new UsageError(`Cannot safely express this filename as a Stryker mutation pattern: ${file}`);
		const ranges = untracked.has(file)
			? [null]
			: changedRanges(
					git(
						'diff',
						'--no-ext-diff',
						'--no-textconv',
						'--no-renames',
						'--no-color',
						'--inter-hunk-context=0',
						'--unified=0',
						mergeBase,
						'--',
						file,
					),
				);
		if (!ranges.length) {
			skip('no added or modified lines (deletion-only or mode change)');
			continue;
		}
		for (const runner of runners) {
			const key = `${packagePath}:${runner}`;
			if (!jobs.has(key)) jobs.set(key, { packagePath, testRunner: runner, targets: [] });
			jobs.get(key).targets.push(...ranges.map((range) => (range ? `${target}:${range}` : target)));
		}
	}
	return { base, mergeBase, jobs: [...jobs.values()], skipped };
}
