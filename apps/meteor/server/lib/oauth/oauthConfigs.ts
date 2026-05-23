import type { Strategy } from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as TwitterStrategy } from 'passport-twitter';

export type OAuthConfig = {
	strategy: new (...args: any[]) => Strategy;
	scope?: string[];
	includeEmail?: boolean;
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
	google: {
		strategy: GoogleStrategy,
		scope: ['email', 'profile'],
	},
	twitter: {
		strategy: TwitterStrategy,
		includeEmail: true,
	},
	github_enterprise: {
		strategy: GitHubStrategy,
		scope: ['user:email'],
	},
} as const;

export type Provider = keyof typeof OAuthConfigs;
