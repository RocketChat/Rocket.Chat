import { globSync } from 'node:fs';
import process from 'node:process';
import { run } from 'node:test';
import { spec as SpecReporter } from 'node:test/reporters';

process.env.NODE_ENV ??= 'test';

const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith('--'));
const files = args.filter((arg) => !arg.startsWith('--'));

run({
	files: files.length ? files : globSync('**/*.test.{ts,js}', { exclude: ['**/node_modules/**', '**/client/**'] }),
	concurrency: true,
	execArgv: ['--experimental-test-module-mocks', '--require', 'tsx', '--require', './tests/setup/chaiPlugins.ts', ...flags],
})
	.on('test:fail', () => {
		process.exitCode = 1;
	})
	.compose(new SpecReporter())
	.pipe(process.stdout);
