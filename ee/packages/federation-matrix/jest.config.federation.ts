/**
 * Jest configuration for federation integration tests.
 *
 * Extends the base server preset with federation-specific settings including
 * extended timeouts for distributed system operations, proper module transformation
 * for Matrix SDK dependencies, and global teardown for resource cleanup.
 */
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	preset: server.preset,
	transformIgnorePatterns: [
		'<rootDir>/node_modules/@babel',
		'<rootDir>/node_modules/@jest',
		'/node_modules/(?!marked|@testing-library|matrix-js-sdk|@vector-im)/',
	],
	// Federation-specific configuration
	testMatch: ['<rootDir>/tests/end-to-end/**/*.spec.ts'],
	testTimeout: 30000, // 30 seconds timeout for federation tests
	forceExit: true, // Force Jest to exit after tests complete
	detectOpenHandles: true, // Detect open handles that prevent Jest from exiting
	globalTeardown: '<rootDir>/tests/teardown.ts',
	// To disable Qase integration, remove this line or comment it out
	setupFilesAfterEnv: ['<rootDir>/tests/setup-qase.ts'],
	verbose: false,
	silent: false,
	reporters: [
		'default',
		...(process.env.QASE_TESTOPS_JEST_API_TOKEN
			? [
					[
						'jest-qase-reporter',
						{
							mode: 'testops',
							testops: {
								api: { token: process.env.QASE_TESTOPS_JEST_API_TOKEN },
								project: 'RC',
								run: { complete: true },
							},
							debug: true,
						},
					] as [string, { [x: string]: unknown }],
				]
			: []),
	] as Config['reporters'],
} satisfies Config;
