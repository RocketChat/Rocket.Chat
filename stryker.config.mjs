import { fileURLToPath } from 'node:url';

import { loadMutationJestConfig } from './scripts/mutation-jest-config.mjs';

export default {
	testRunner: 'jest',
	plugins: ['@stryker-mutator/jest-runner', fileURLToPath(new URL('./scripts/mutation-target-reporter.mjs', import.meta.url))],
	jest: await loadMutationJestConfig(),
	coverageAnalysis: 'perTest',
	concurrency: 2,
	ignorePatterns: ['reports/**'],
	reporters: ['mutation-targets', 'clear-text', 'progress', 'html', 'json'],
	thresholds: { break: 0 },
};
