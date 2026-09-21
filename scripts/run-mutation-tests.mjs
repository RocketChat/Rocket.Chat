import { spawn } from 'node:child_process';
import { constants } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { planDiff, planExplicit, UsageError } from './mutation-diff.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const usage = 'Usage: yarn test:mutation --diff\n       yarn test:mutation <package-path> --mutate <source-patterns>';

async function runJob({ packagePath, testRunner, targets }) {
	console.log(`\n${packagePath} (${testRunner}): ${targets.join(', ')}`);
	return new Promise((done) => {
		const child = spawn(process.execPath, [fileURLToPath(new URL('./mutation-worker.mjs', import.meta.url)), testRunner, ...targets], {
			cwd: resolve(root, packagePath),
			stdio: 'inherit',
		});
		let interrupted;
		const interrupt = (signal) => {
			interrupted = signal;
			child.kill(signal);
		};
		const onInt = () => interrupt('SIGINT');
		const onTerm = () => interrupt('SIGTERM');
		process.on('SIGINT', onInt);
		process.on('SIGTERM', onTerm);
		child.on('error', (error) => console.error(error.message));
		child.on('close', (code, signal) => {
			process.off('SIGINT', onInt);
			process.off('SIGTERM', onTerm);
			const cancelled = interrupted ?? signal;
			done(cancelled ? 128 + constants.signals[cancelled] : (code ?? 3));
		});
	});
}

async function main() {
	const args = process.argv.slice(2);
	let plan;
	if (args.length === 1 && args[0] === '--diff') plan = planDiff(root);
	else if (args.length === 3 && !args[0].startsWith('-') && args[1] === '--mutate') plan = planExplicit(root, args[0], args[2]);
	else throw new UsageError(usage);
	const { jobs, skipped } = plan;
	for (const { file, reason } of skipped) console.log(`Skipped ${file}: ${reason}`);
	if (!jobs.length) console.log('No changed production lines to mutation-test.');
	let exitCode = 0;
	for (const job of jobs) {
		const code = await runJob(job);
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
