import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type LoginService = LoginServiceConfiguration & {
	icon?: string;
	title?: string;
};

export type AuthenticationContextValue = {
	readonly isLoggingIn: boolean;
	loginWithPassword: (user: string | { username: string } | { email: string } | { id: string }, password: string) => Promise<void>;
	loginWithToken: (user: string) => Promise<void>;
	loginWithService<T extends LoginServiceConfiguration>(service: T): () => Promise<true>;
	loginWithIframe: (token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>;
	loginWithTokenRoute: (token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>;
	unstoreLoginToken: (callback: () => void) => () => void;
	queryLoginServices: {
		getCurrentValue: () => LoginService[];
		subscribe: (onStoreChange: () => void) => () => void;
	};
};

export const AuthenticationContext = createContext<AuthenticationContextValue>({
	isLoggingIn: false,
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
	loginWithPassword: async () => Promise.reject('loginWithPassword not implemented'),
	loginWithToken: async () => Promise.reject('loginWithToken not implemented'),
	loginWithIframe: async () => Promise.reject('loginWithIframe not implemented'),
	loginWithTokenRoute: async () => Promise.reject('loginWithTokenRoute not implemented'),
	unstoreLoginToken: () => async () => Promise.reject('unstoreLoginToken not implemented'),
	queryLoginServices: {
		getCurrentValue: () => [],
		subscribe: (_: () => void) => () => Promise.reject('queryLoginServices not implemented'),
	},
});
