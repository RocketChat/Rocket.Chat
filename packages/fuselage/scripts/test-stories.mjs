// Usage: yarn test:stories <storybook-static dir> [test-storybook options]
// Runs the `play` function of every story tagged g0 in a Chromium against a Storybook build: the runtime build, or the zero-runtime
// one (FUSELAGE_ZERO_RUNTIME=1 yarn build-storybook). `--includeTags` and the other options of `test-storybook` can be overridden.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { serve } from './verify/serve.mjs';

const [dir, ...options] = process.argv.slice(2);

if (!dir || !existsSync(join(dir, 'index.json'))) {
	console.error('Usage: yarn test:stories <storybook-static dir> [test-storybook options]');
	process.exit(2);
}

const server = await serve(dir);
const args = [
	'exec',
	'test-storybook',
	'--url',
	server.url,
	'--index-json',
	...(options.some((o) => o.startsWith('--includeTags')) ? [] : ['--includeTags', 'g0']),
	...options,
];

const child = spawn('yarn', args, { stdio: 'inherit', cwd: join(import.meta.dirname, '..') });
child.on('exit', (code) => {
	server.close();
	process.exit(code ?? 1);
});
