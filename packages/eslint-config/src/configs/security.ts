import securityPlugin from 'eslint-plugin-security';
import type { ConfigWithExtends } from 'typescript-eslint';
import rules from '../rules/security.js';
import type { Config } from '../types/config.js';

import type { RuleOptions } from '../typegen.js';

type AllRules = keyof RuleOptions & {};
type AllPrefixes = AllRules extends infer R ? (R extends `${infer P}/${string}` ? P : never) : never;

type Rules<T extends AllPrefixes> = {
	[RuleName in keyof RuleOptions as RuleName extends `${T}/${string}` ? RuleName : never]: RuleOptions[RuleName];
};

export default function security(config: Config<Rules<'security'>> = {}): ConfigWithExtends {
	return {
		name: 'security',
		plugins: {
			security: securityPlugin,
		},
		rules: {
			...rules.recommended,
			...config.rules,
		},
	};
}
