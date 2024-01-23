import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type LoginService = LoginServiceConfiguration & {
	title?: string;
	icon?: string;
};

export type AuthenticationContextValue = {
	loginWithPassword: (user: string | { username: string } | { email: string } | { id: string }, password: string) => Promise<void>;
	loginWithToken: (user: string) => Promise<void>;

	loginWithService<T extends LoginService>(service: T): () => Promise<true>;

	queryLoginServices: {
		getCurrentValue: () => LoginService[];
		subscribe: (onStoreChange: () => void) => () => void;
	};
};

export const AuthenticationContext = createContext<AuthenticationContextValue>({
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
	loginWithPassword: async () => Promise.reject('loginWithPassword not implemented'),
	loginWithToken: async () => Promise.reject('loginWithToken not implemented'),

	queryLoginServices: {
		getCurrentValue: () => [],
		subscribe: (_: () => void) => () => Promise.reject('queryLoginServices not implemented'),
	},
});
