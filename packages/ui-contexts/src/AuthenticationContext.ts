import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type LoginService = LoginServiceConfiguration & {
	icon?: string;
	title?: string;
};

export type AuthenticationContextValue = {
	loginWithPassword: (user: string | { username: string } | { email: string } | { id: string }, password: string) => Promise<void>;
	loginWithToken: (user: string) => Promise<void>;

	getLoginServices: () => LoginService[];
	loginWithService<T extends LoginServiceConfiguration>(service: T): () => Promise<true>;
};

export const AuthenticationContext = createContext<AuthenticationContextValue>({
	getLoginServices: () => [],
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
	loginWithPassword: async () => Promise.reject('loginWithPassword not implemented'),
	loginWithToken: async () => Promise.reject('loginWithToken not implemented'),
});
