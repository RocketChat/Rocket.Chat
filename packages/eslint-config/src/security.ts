// @ts-expect-error security plugin is not typed
import securityPlugin from 'eslint-plugin-security';
import type { Linter } from 'eslint';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/security.js';
import type { MergeRules } from './types/rules.js';

type Rules = MergeRules<[typeof rules.recommended]>;

export default function security(config: Linter.Config<Rules> = {}): Linter.Config & ConfigWithExtends {
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
		plugins: { security: securityPlugin },
		rules: {
			...rules.recommended,
			...config.rules,
		},
	};
}
