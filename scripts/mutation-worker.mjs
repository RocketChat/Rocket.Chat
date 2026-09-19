import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Stryker } from '@stryker-mutator/core';

import { loadMutationJestConfig } from './mutation-jest-config.mjs';

const [testRunner, ...mutate] = process.argv.slice(2);
const reports = resolve('reports/mutation', testRunner);
try {
	// A failed run must not leave an older successful report in its place.
	await rm(reports, { recursive: true, force: true });
	const options = {
		configFile: fileURLToPath(new URL('../stryker.config.mjs', import.meta.url)),
		testRunner,
		mutate,
		inPlace: false,
		jsonReporter: { fileName: resolve(reports, 'mutation.json') },
		htmlReporter: { fileName: resolve(reports, 'mutation.html') },
	};
	if (testRunner === 'mocha') {
		options.mochaOptions = { config: '.mocharc.js' };
		// The unit suite uses tsx, which transpiles without type checking.
		options.disableTypeChecks = false;
	} else options.jest = await loadMutationJestConfig();
	const mutants = await new Stryker(options).runMutationTest();
	if (mutants.some(({ status }) => status === 'Pending' || status === 'RuntimeError')) {
		throw new Error('Mutation testing did not complete successfully. Check the report and terminal output.');
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = 3;
}
