import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	preset: server.preset,
	transformIgnorePatterns: ['<rootDir>/node_modules/@babel', '<rootDir>/node_modules/@jest', '/node_modules/(?!marked|@testing-library/)'],
	// Exclude integration/e2e tests from unit test runs
	testPathIgnorePatterns: ['<rootDir>/tests/end-to-end/'],
} satisfies Config;
