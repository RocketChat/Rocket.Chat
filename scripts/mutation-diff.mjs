import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, matchesGlob, relative, resolve, sep } from 'node:path';

export class UsageError extends Error {}
const slash = (path) => path.split(sep).join('/');

export function packageDirectory(root, target) {
	const directory = resolve(root, target);
	const path = relative(root, directory);
	if (!path || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path) || !existsSync(resolve(directory, 'package.json'))) {
		throw new UsageError(`Expected a package directory inside this repository: ${target}`);
	}
	const real = relative(realpathSync(root), realpathSync(directory));
	if (real === '..' || real.startsWith(`..${sep}`) || isAbsolute(real))
		throw new UsageError(`Package resolves outside this repository: ${target}`);
	if (!existsSync(resolve(directory, 'jest.config.ts')))
		throw new UsageError(`No jest.config.ts found in ${target}. A single-project Jest TypeScript configuration is required.`);
	return directory;
}

export function changedRanges(diff) {
	return [...diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)]
		.map(([, start, count = '1']) => ({ start: Number(start), count: Number(count) }))
		.filter(({ count }) => count > 0)
		.map(({ start, count }) => `${start}-${start + count - 1}`);
}

const NON_SOURCE = [
	/\.d\.[cm]?ts$/,
	/\.(test|spec)\.[cm]?[jt]sx?$/,
	/(^|\/)__(tests|mocks)__\//,
	/\.stories\.[cm]?[jt]sx?$/,
	/\.config\.[cm]?[jt]s$/,
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
		throw new UsageError(`Cannot find a merge base with ${base}. Fetch the base branch or select an available ref with --base.`);
	}
	const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
	const workspaces = manifest.workspaces?.packages ?? manifest.workspaces ?? [];
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
		if (!existsSync(resolve(directory, 'jest.config.ts'))) {
			skip('package has no jest.config.ts');
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
		if (!jobs.has(packagePath)) jobs.set(packagePath, { packagePath, targets: [] });
		jobs.get(packagePath).targets.push(...ranges.map((range) => (range ? `${target}:${range}` : target)));
	}
	return { base, mergeBase, jobs: [...jobs.values()], skipped };
}
