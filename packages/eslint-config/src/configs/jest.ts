import type { Linter } from 'eslint';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from '../rules/jest.js';
import type { MergeRules } from '../types/rules.js';
import type { Config } from '../types/config.js';
import { readConfig } from 'jest-config';
type Rules = MergeRules<[typeof rules.recommended, typeof rules.style]>;

async function jest(config: Config<Rules> = {}): Promise<Linter.Config & ConfigWithExtends> {
	const jestConfig = await readConfig(
		{
			$0: 'yarn jest',
			_: [],
		},
		'jest.config.ts',
	);
	config.files ??= jestConfig.projectConfig.testMatch;

	return {
		name: 'jest',
		files: config.files,
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
