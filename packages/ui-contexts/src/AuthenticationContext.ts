import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type LoginService = LoginServiceConfiguration & {
	icon?: string;
	title?: string;
};

export type AuthenticationContextValue = {
	loginWithPassword: (user: string | { username: string } | { email: string } | { id: string }, password: string) => Promise<void>;
	loginWithToken: (user: string) => Promise<void>;
	loginWithService<T extends LoginServiceConfiguration>(service: T): () => Promise<true>;
	loginWithIframe: (token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>;
	loginWithTokenRoute: (token: string, callback?: (error: Error | null | undefined) => void) => Promise<void>;
	unstoreLoginToken: (callback: () => void) => () => void;
	queryLoginServices: () => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => LoginService[] | undefined];
};

export const AuthenticationContext = createContext<AuthenticationContextValue | undefined>(undefined);

export const useAuthenticationContext = () => {
	const context = useContext(AuthenticationContext);

	if (!context) {
		throw new Error('Must be running in Authentication Context');
	}

	return context;
};
