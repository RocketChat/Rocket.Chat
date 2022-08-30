import { createContext } from 'react';

export type LoginService = {
	service: string;
	displayName: string;
	icon: string;
	color: string;
};

export type LoginContextValue = {
	// loginWith(service: string): ()
	queryAllServices(): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => LoginService[]];
};

export const LoginContext = createContext<LoginContextValue>({
	queryAllServices: () => [() => (): void => undefined, (): LoginService[] => []],
});
