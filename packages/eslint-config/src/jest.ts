import type { Linter } from 'eslint';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/jest.js';
import type { MergeRules } from './types/rules.js';
import { readConfig } from 'jest-config';
import { existsSync } from 'fs';

async function jest(
	config: Linter.Config<MergeRules<[typeof rules.recommended, typeof rules.style]>> = {},
): Promise<Linter.Config & ConfigWithExtends> {
	if (!existsSync('./jest.config.ts')) {
		throw new Error('jest.config.ts file not found. Please ensure you have a Jest configuration file in your project root.');
	}

	const jestConfig = await readConfig(
		{
			$0: 'yarn jest',
			_: [],
		},
		'jest.config.ts',
	);

	const files = jestConfig.projectConfig.testMatch;

	return {
		files: config.files ? config.files : files,
		plugins: { jest: jestPlugin },
		rules: {
			...rules.recommended,
			...rules.style,
			...config.rules,
		},
		languageOptions: {
			globals: config.languageOptions?.globals ?? globals.jest,
		},
	};
}

export default jest;
