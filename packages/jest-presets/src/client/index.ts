import type { Config } from 'jest';

export type {} from '@testing-library/jest-dom'; // trick to cascade global types for Jest matchers

const preset = '@rocket.chat/jest-presets/client';

export default {
	preset,
	setupFilesAfterEnv: [`${preset}/jest-setup.js`],
} satisfies Config;
