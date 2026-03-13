import type { Strategy } from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';

export const strategyMap = {
	github: GitHubStrategy,
	facebook: FacebookStrategy,
} satisfies Record<string, new (...args: any[]) => Strategy>;

export type Provider = keyof typeof strategyMap;
