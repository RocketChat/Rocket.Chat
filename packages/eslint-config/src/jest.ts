import type { Linter } from 'eslint';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/jest.js';
import type { MergeRules } from './types/rules.js';

function jest(config: Linter.Config<MergeRules<[typeof rules.recommended, typeof rules.style]>> = {}): Linter.Config & ConfigWithExtends {
	return {
		files: config.files ? config.files : ['**/*.spec.js', '**/*.spec.jsx', '**/*.spec.ts'],
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
