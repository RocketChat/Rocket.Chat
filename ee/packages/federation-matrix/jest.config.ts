import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	preset: server.preset,
	transformIgnorePatterns: [
		'<rootDir>/node_modules/@babel',
		'<rootDir>/node_modules/@jest',
		// sanitize-html vendors its own (ESM-only) htmlparser2 + friends under a nested node_modules
		'/node_modules/(?!marked|@testing-library/|(dom-serializer|domelementtype|domhandler|domutils|entities|htmlparser2)/|sanitize-html/node_modules/)',
	],
	// Exclude integration/e2e tests from unit test runs
	testPathIgnorePatterns: ['<rootDir>/tests/end-to-end/'],
} satisfies Config;
