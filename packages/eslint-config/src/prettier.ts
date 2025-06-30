import prettierPlugin from 'eslint-plugin-prettier';

import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/prettier.js';
import type { MergeRules } from './types/rules.js';
import type { Config } from './types/config.js';

type Rules = MergeRules<[typeof rules.recommended]>;

export default function prettier(config: Config<Rules> = {}): ConfigWithExtends {
	return {
		name: 'prettier',
		plugins: { prettier: prettierPlugin },
		rules: {
			...rules.recommended,
			...config.rules,
		},
	};
}
