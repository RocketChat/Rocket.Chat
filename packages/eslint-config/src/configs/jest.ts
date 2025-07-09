import type { Linter } from 'eslint';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';
import { readConfig } from 'jest-config';

async function jest(config: Linter.Config = {}): Promise<Linter.Config> {
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
			...jestPlugin.configs['flat/recommended'].rules,
			...config.rules,
		},
		languageOptions: {
			globals: config.languageOptions?.globals ?? globals.jest,
		},
	};
}

export default jest;
