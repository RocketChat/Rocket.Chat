import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { packageDirectory, planDiff, UsageError } from './mutation-diff.mjs';
import { buildSummary, summaryExitCode } from './mutation-summary.mjs';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const usage = `Usage:
  yarn test:mutation <package-path> [--min-score <0-100>] [Stryker options]
  yarn test:mutation --diff [--base <ref>] [--plan] [--min-score <0-100>] [Stryker options]

Examples:
  yarn test:mutation packages/tools --mutate src/censorUrl.ts
  yarn test:mutation --diff --base origin/develop --plan

--plan prints targets without running tests. --min-score enables an optional gate.
Diff mode compares the working tree with the merge base, including untracked files.
`;

function parseArgs(args) {
	const result = { options: [], minScore: null, base: 'origin/develop' };
	if (args[0] && !args[0].startsWith('-')) result.target = args.shift();
	for (let i = 0; i < args.length; i++) {
		const [flag, inline] = args[i].split(/=(.*)/s);
		if (flag === '--diff') result.diff = true;
		else if (flag === '--plan') result.plan = true;
		else if (flag === '--base' || flag === '--min-score') {
			const value = inline ?? args[++i];
			if (!value || value.startsWith('--')) throw new UsageError(`${flag} requires a value.`);
			if (flag === '--base') result.base = value;
			else {
				result.minScore = Number(value);
				if (!Number.isFinite(result.minScore) || result.minScore < 0 || result.minScore > 100) {
					throw new UsageError('--min-score must be a number from 0 to 100.');
				}
			}
		} else result.options.push(args[i]);
	}
	if (result.diff && result.target) throw new UsageError('--diff cannot be combined with a package target.');
	if (!result.diff && (result.plan || args.some((arg) => /^--base(?:=|$)/.test(arg))))
		throw new UsageError('--plan and --base require --diff.');
	if (result.diff && result.options.some((option) => /^(?:-m|--mutate)(?:=|$)/.test(option))) {
		throw new UsageError('--diff selects mutation targets; do not combine it with --mutate.');
	}
	if (result.options.some((option) => /^--inPlace(?:=|$)/.test(option)))
		throw new UsageError('This command uses sandboxed mutation testing.');
	if (result.minScore !== null && result.options.includes('--dryRunOnly'))
		throw new UsageError('--min-score cannot be used with --dryRunOnly.');
	return result;
}

async function runJob(job, options, minScore) {
	const directory = packageDirectory(root, job.packagePath);
	const reports = resolve(directory, 'reports/mutation');
	await mkdir(reports, { recursive: true });
	// Never let an old report make a crashed or dry-only run look successful.
	await Promise.all(['mutation.json', 'mutation.html', 'summary.json'].map((file) => rm(resolve(reports, file), { force: true })));
	const args = [fileURLToPath(new URL('./mutation-worker.mjs', import.meta.url)), ...options];
	if (job.targets) args.push('--mutate', job.targets.join(','));
	const outcome = await new Promise((done) => {
		const child = spawn(process.execPath, args, { cwd: directory, stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
		let state = {};
		let interrupted;
		const interrupt = (signal) => {
			interrupted = signal;
			child.kill(signal);
		};
		const onInt = () => interrupt('SIGINT');
		const onTerm = () => interrupt('SIGTERM');
		process.on('SIGINT', onInt);
		process.on('SIGTERM', onTerm);
		child.on('message', (message) => {
			state = message;
		});
		child.on('error', (error) => {
			state.error = error.message;
		});
		child.on('close', (exitCode, signal) => {
			process.off('SIGINT', onInt);
			process.off('SIGTERM', onTerm);
			done({ ...state, exitCode, signal: interrupted ?? signal });
		});
	});
	let report = null;
	try {
		report = JSON.parse(await readFile(resolve(reports, 'mutation.json'), 'utf8'));
	} catch (error) {
		if (error.code !== 'ENOENT') outcome.error = `Cannot read mutation report: ${error.message}`;
	}
	const summary = buildSummary(report, { ...outcome, packagePath: job.packagePath, targets: job.targets ?? outcome.targets, minScore });
	await writeFile(resolve(reports, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
	console.log(
		`\n${job.packagePath}: ${summary.status}; score ${summary.score === null ? 'n/a' : `${summary.score.toFixed(2)}%`}; gate ${summary.gate}`,
	);
	console.log(`Summary: ${relative(root, resolve(reports, 'summary.json'))}`);
	return summaryExitCode(summary);
}

async function main() {
	const args = process.argv.slice(2);
	if (!args.length || args[0] === '--help' || args[0] === '-h') {
		console.log(usage);
		return args.length ? 0 : 2;
	}
	const { target, diff, base, plan, options, minScore } = parseArgs(args);
	if (diff && options.some((option) => ['--help', '-h'].includes(option))) {
		console.log(usage);
		return 0;
	}
	if (!diff && !target) throw new UsageError(usage);
	// Preserve access to Stryker's own CLI help without deleting reports.
	if (target && options.some((option) => ['--help', '-h', '--version', '-V'].includes(option))) {
		const child = spawn(process.execPath, [fileURLToPath(new URL('./mutation-worker.mjs', import.meta.url)), ...options], {
			cwd: packageDirectory(root, target),
			stdio: 'inherit',
		});
		return new Promise((done) => {
			child.on('error', () => done(3));
			child.on('close', (code) => done(code ?? 3));
		});
	}
	const selection = diff ? planDiff(root, base) : { jobs: [{ packagePath: target }], skipped: [] };
	if (plan) {
		console.log(JSON.stringify(selection, null, 2));
		return 0;
	}
	for (const { file, reason } of selection.skipped) console.log(`Skipped ${file}: ${reason}`);
	if (!selection.jobs.length) console.log('No eligible changed lines to mutation-test. No mutation score was measured.');
	let exitCode = 0;
	for (const job of selection.jobs) {
		const code = await runJob(job, options, minScore);
		if (code >= 128) return code;
		exitCode = Math.max(exitCode, code);
	}
	return exitCode;
}

try {
	process.exitCode = await main();
} catch (error) {
	console.error(error.message);
	process.exitCode = error instanceof UsageError ? 2 : 3;
}
