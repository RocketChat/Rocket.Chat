import type { Strategy } from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';

import { CustomOAuthStrategy } from './passport';

export type StrategyConstructor = new (...args: any[]) => Strategy;

export const builtInStrategyMap = {
	github: GitHubStrategy,
	facebook: FacebookStrategy,
} satisfies Record<string, StrategyConstructor>;

export type BuiltInProvider = keyof typeof builtInStrategyMap;

export const isBuiltInProvider = (provider: string): provider is BuiltInProvider => {
	return provider in builtInStrategyMap;
};

export const getStrategy = (provider: string): StrategyConstructor => {
	if (isBuiltInProvider(provider)) {
		return builtInStrategyMap[provider];
	}
	return CustomOAuthStrategy as unknown as StrategyConstructor;
};

// For backwards compatibility
export const strategyMap = builtInStrategyMap;
export type Provider = BuiltInProvider;
