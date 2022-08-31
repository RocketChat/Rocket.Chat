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
	// loginWith(service: string): ()
	queryAllServices(): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => LoginService[]];
	loginWithService<T extends LoginService>(service: T): () => Promise<true>;
};

export const LoginContext = createContext<LoginContextValue>({
	queryAllServices: () => [() => (): void => undefined, (): LoginService[] => []],
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
});
