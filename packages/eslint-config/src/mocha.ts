import mochaPlugin from 'eslint-plugin-mocha';
import globals from 'globals';

import type { Linter } from 'eslint';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/mocha.js';
import type { MergeRules } from './types/rules.js';

type Rules = MergeRules<[typeof rules.all, typeof rules.recommended]>;

export default function mocha(config: Linter.Config<Rules> = {}): Linter.Config & ConfigWithExtends {
	return {
		files: config.files ?? [
			'**/*.spec.js',
			'**/*.test.js',
			'**/*.tests.js',
			'**/*.mock.js',
			'**/*.spec.ts',
			'**/*.test.ts',
			'**/*.tests.ts',
			'**/*.mock.ts',
		],
		plugins: { mocha: mochaPlugin },
		languageOptions: {
			globals: config.languageOptions?.globals ?? globals.mocha,
		},
		rules: {
			...rules.recommended,
			...config.rules,
		},
	};
}
