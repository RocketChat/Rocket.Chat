// @ts-expect-error security plugin is not typed
import securityPlugin from 'eslint-plugin-security';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from './rules/security.js';
import type { MergeRules } from './types/rules.js';
import type { Config } from './types/config.js';

type Rules = MergeRules<[typeof rules.recommended]>;

export default function security(config: Config<Rules> = {}): ConfigWithExtends {
	return {
		name: 'security',
		plugins: {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			security: securityPlugin,
		},
		rules: {
			...rules.recommended,
			...config.rules,
		},
	};
}
