import { createContext } from 'react';

export type LoginService = {
	clientConfig: unknown;

	title: string;
	service: 'meteor-developer';

	buttonLabelText?: string;
	icon?: string;
};

export type AuthenticationContextValue = {
	loginWithPassword: (user: string | { username: string } | { email: string } | { id: string }, password: string) => Promise<void>;
	loginWithToken: (user: string) => Promise<void>;

	queryAllServices(): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => LoginService[]];
	loginWithService<T extends LoginService>(service: T): () => Promise<true>;
};

export const AuthenticationContext = createContext<AuthenticationContextValue>({
	queryAllServices: () => [() => (): void => undefined, (): LoginService[] => []],
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
	loginWithPassword: async () => Promise.reject('loginWithPassword not implemented'),
	loginWithToken: async () => Promise.reject('loginWithToken not implemented'),
});
