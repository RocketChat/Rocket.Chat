import { createContext } from 'react';

export type LoginService = {
	service: string;
	icon: string;
	displayName: string;
	buttonLabelText?: string;
	buttonLabelColor?: string;
	buttonColor?: string;
};

export type LoginContextValue = {
	// loginWith(service: string): ()
	queryAllServices(): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => LoginService[]];
	queryService(service: string): LoginService | undefined;
	loginWithService<T extends { service: string; clientConfig?: unknown }>(service: T): () => Promise<true>;
};

export const LoginContext = createContext<LoginContextValue>({
	queryAllServices: () => [() => (): void => undefined, (): LoginService[] => []],
	queryService: () => undefined,
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
});
