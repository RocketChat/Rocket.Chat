import type { Strategy } from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';

export type OAuthConfig = {
	strategy: new (...args: any[]) => Strategy;
	scope: string[];
};

export const OAuthConfigs: Record<string, OAuthConfig> = {
	github: {
		strategy: GitHubStrategy,
		scope: ['user:email'],
	},
	facebook: {
		strategy: FacebookStrategy,
		scope: ['email'],
	},
} as const;

export type Provider = keyof typeof OAuthConfigs;
