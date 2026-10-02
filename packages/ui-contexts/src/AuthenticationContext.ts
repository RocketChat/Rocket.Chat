import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';

import { createRequiredContext } from './createRequiredContext';

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

export const [AuthenticationContextProvider, useAuthenticationContext] =
	createRequiredContext<AuthenticationContextValue>('AuthenticationContext');
