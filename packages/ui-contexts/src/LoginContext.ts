import { createContext } from 'react';

export type LoginService = {
	clientConfig: unknown;

	title: string;
	service: string;

	buttonLabelText?: string;
	buttonLabelColor?: string;
	buttonColor?: string;
};

export type LoginContextValue = {
	loginWithPassword: (user: string | object, password: string) => Promise<void>;
	loginWithToken: (user: string) => Promise<void>;
	logout: () => Promise<void>;

	queryAllServices(): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => LoginService[]];
	loginWithService<T extends LoginService>(service: T): () => Promise<true>;
};

export const LoginContext = createContext<LoginContextValue>({
	queryAllServices: () => [() => (): void => undefined, (): LoginService[] => []],
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
	loginWithPassword: async () => Promise.reject('loginWithPassword not implemented'),
	loginWithToken: async () => Promise.reject('loginWithToken not implemented'),
	logout: () => Promise.resolve(),
});
