import type { Linter } from 'eslint';

interface Rule {
	[K: string]: Linter.RuleSeverity;
}

export type ExtractRules<T extends Rule> = {
	-readonly [K in keyof T]: Linter.RuleEntry<unknown[]>;
};

export type MergeRules<T extends [Rule, ...Rule[]]> = {
	-readonly [K in keyof T]: ExtractRules<T[K]>;
}[number];
