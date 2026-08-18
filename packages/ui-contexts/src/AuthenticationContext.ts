import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type LoginService = LoginServiceConfiguration & {
	icon?: string;
	title?: string;
};

export type AuthenticationContextValue = {
	readonly isLoggingIn: boolean;
	loginWithPassword: (user: string | { username: string } | { email: string } | { id: string }, password: string) => Promise<void>;
	loginWithToken: (user: string, callback?: (error: Error | null | undefined) => void) => Promise<void>;
	loginWithService<T extends LoginServiceConfiguration>(service: T): () => Promise<true>;
	loginWithCustomOauth: (service: string, options: { redirectUrl: string }, callback?: (response: unknown) => void) => void;
	loginWithIframe: (token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>;
	loginWithTokenRoute: (token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>;
	getLoginToken: () => string | null;
	unstoreLoginToken: (callback: () => void) => () => void;
	wipeLocalAuth: () => void;
	queryLoginServices: {
		getCurrentValue: () => LoginService[];
		subscribe: (onStoreChange: () => void) => () => void;
	};
};

export const AuthenticationContext = createContext<AuthenticationContextValue>({
	isLoggingIn: false,
	loginWithService: () => () => Promise.reject(new Error('loginWithService not implemented')),
	loginWithCustomOauth: () => {
		throw new Error('loginWithCustomOauth not implemented');
	},
	loginWithPassword: async () => Promise.reject(new Error('loginWithPassword not implemented')),
	loginWithToken: async () => Promise.reject(new Error('loginWithToken not implemented')),
	loginWithIframe: async () => Promise.reject(new Error('loginWithIframe not implemented')),
	loginWithTokenRoute: async () => Promise.reject(new Error('loginWithTokenRoute not implemented')),
	getLoginToken: () => {
		throw new Error('getLoginToken not implemented');
	},
	unstoreLoginToken: () => {
		throw new Error('unstoreLoginToken not implemented');
	},
	wipeLocalAuth: () => {
		throw new Error('wipeLocalAuth not implemented');
	},
	queryLoginServices: {
		getCurrentValue: () => [],
		subscribe: (_: () => void) => {
			throw new Error('queryLoginServices not implemented');
		},
	},
});
