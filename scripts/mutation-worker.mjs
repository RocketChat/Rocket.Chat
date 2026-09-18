import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Stryker, StrykerCli } from '@stryker-mutator/core';

import { loadMutationJestConfig } from './mutation-jest-config.mjs';

const config = fileURLToPath(new URL('../stryker.config.mjs', import.meta.url));
new StrykerCli([process.execPath, 'stryker', 'run', config, ...process.argv.slice(2)], undefined, async (options) => {
	try {
		if (options.testRunner === 'mocha') {
			options.mochaOptions = { config: '.mocharc.js' };
			if (options.testFiles) {
				// Scope via Mocha: Stryker 10's global file filter is interpreted as test names
				// by this runner, leaving static mutants with no matching tests.
				options.mochaOptions.spec = options.testFiles;
				delete options.testFiles;
			}
			// The unit suite uses tsx, which transpiles without type checking.
			options.disableTypeChecks = false;
		} else options.jest = await loadMutationJestConfig();
		// Keep JSON and target validation even when console reporters are customized.
		if (options.reporters) options.reporters = [...new Set([...options.reporters, 'json', 'mutation-targets'])];
		const reports = resolve('reports/mutation', options.testRunner ?? 'jest');
		options.jsonReporter = { fileName: resolve(reports, 'mutation.json') };
		options.htmlReporter = { fileName: resolve(reports, 'mutation.html') };
		options.inPlace = false;
		await new Stryker(options).runMutationTest();
		process.send?.({ completion: options.dryRunOnly ? 'dry-run' : 'complete', targets: options.mutate ?? null });
	} catch (error) {
		console.error(error.message);
		process.send?.({ completion: 'failed', error: error.message });
		process.exitCode = 3;
	} finally {
		process.disconnect?.();
	}
}).run();
