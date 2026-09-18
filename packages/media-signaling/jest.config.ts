import client from '@rocket.chat/jest-presets/client';
import type { Config } from 'jest';

export default {
	preset: client.preset,
	// The integration harness is test scaffolding: its own coverage would mask the coverage of the package
	coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/src/tests/'],
} satisfies Config;
