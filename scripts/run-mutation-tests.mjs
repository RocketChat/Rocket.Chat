import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage =
	'Usage: yarn test:mutation <package-path> [Stryker options]\nExample: yarn test:mutation packages/tools --mutate src/censorUrl.ts';
const [target, ...options] = process.argv.slice(2);

if (!target || target.startsWith('-')) {
	console.log(usage);
	process.exit(target === '--help' || target === '-h' ? 0 : 1);
}

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, target);
const packagePath = relative(root, directory);

if (!packagePath || packagePath.startsWith('..') || isAbsolute(packagePath) || !existsSync(resolve(directory, 'package.json'))) {
	console.error(`Expected a package directory inside this repository: ${target}\n${usage}`);
	process.exit(1);
}

if (!existsSync(resolve(directory, 'jest.config.ts'))) {
	console.error(`No jest.config.ts found in ${target}. This command supports packages with an existing Jest TypeScript configuration.`);
	process.exit(1);
}

// Keep Jest resolution, mutation patterns, sandboxes, and reports relative to the selected package.
process.chdir(directory);
const { StrykerCli } = await import('@stryker-mutator/core');
new StrykerCli([process.execPath, 'stryker', 'run', resolve(root, 'stryker.config.mjs'), ...options]).run();
