import process from 'node:process';
import { run } from 'node:test';
import { spec as SpecReporter } from 'node:test/reporters';

run({
	globPatterns: process.argv.slice(2),
	concurrency: 1,
	timeout: 10_000,
	execArgv: [
		'--require',
		'tsx',
		'--require',
		'./tests/setup/chaiPlugins.ts',
		'--require',
		'./tests/end-to-end/dumpLastRequestOnFailure.ts',
	],
})
	.on('test:fail', () => {
		process.exitCode = 1;
	})
	.compose(new SpecReporter())
	.pipe(process.stdout);
