import type { Linter } from 'eslint';

export type ExtractRules<T extends Record<string, unknown>> = {
	-readonly [K in keyof T]: Linter.RuleEntry<unknown[]>;
};
