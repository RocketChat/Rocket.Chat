import type { Linter } from 'eslint';

interface Rule<T extends unknown[] = unknown[]> {
	[K: string]: Linter.RuleEntry<T>;
}

export type ExtractRules<T extends Rule> = {
	-readonly [K in keyof T]: Linter.RuleEntry<unknown[]>;
};

export type MergeRules<T extends [Rule, ...Rule[]]> = {
	-readonly [K in keyof T]: ExtractRules<T[K]>;
}[number];
