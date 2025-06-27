import mochaPlugin from 'eslint-plugin-mocha';
import globals from 'globals';

import type { Linter } from 'eslint';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/mocha.js';
import type { ExtractRules } from './types/rules.js';

type Rules = ExtractRules<typeof rules.recommended | typeof rules.all>;

function mocha(config: Linter.Config<Rules> = {}): Linter.Config & ConfigWithExtends {
	return {
		files: config.files ?? ['**/*.spec.js', '**/*.test.js', '**/*.tests.js', '**/*.mock.js'],
		plugins: { mocha: mochaPlugin },
		languageOptions: {
			globals: config.languageOptions?.globals ?? globals.mocha,
		},
	};
}

export default mocha;
