import client from '@rocket.chat/jest-presets/client';
import type { Config } from 'jest';

export default {
	preset: client.preset,
	testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}'],
	setupFilesAfterEnv: [...client.setupFilesAfterEnv, '<rootDir>/jest-setup.ts'],
	// Tamagui ships ES modules, which Jest has to transform
	transformIgnorePatterns: [
		'<rootDir>/node_modules/@babel',
		'<rootDir>/node_modules/@jest',
		'/node_modules/(?!@testing-library/|@faker-js/|@tamagui/)',
	],
	moduleNameMapper: {
		'\\.scss$': 'identity-obj-proxy',
	},
} satisfies Config;
