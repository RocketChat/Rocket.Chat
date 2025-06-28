import prettierPlugin from 'eslint-plugin-prettier';

import type { Linter } from 'eslint';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/prettier.js';
import type { MergeRules } from './types/rules.js';

type Rules = MergeRules<[typeof rules.recommended]>;

export default function prettier(config: Linter.Config<Rules> = {}): Linter.Config & ConfigWithExtends {
	return {
		plugins: { prettier: prettierPlugin },
		rules: {
			...rules.recommended,
			...config.rules,
		},
	};
}
