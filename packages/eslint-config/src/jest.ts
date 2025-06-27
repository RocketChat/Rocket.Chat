import type { Linter } from 'eslint';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/jest.js';
import type { ExtractRules } from './types/rules.js';

type Rules = typeof rules.recommended & typeof rules.style;

function jest(config: Linter.Config<ExtractRules<Rules>> = {}): Linter.Config & ConfigWithExtends {
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
