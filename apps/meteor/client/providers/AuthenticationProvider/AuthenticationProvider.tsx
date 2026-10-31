import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { capitalize } from '@rocket.chat/tools';
import { AuthenticationContext, useSetting } from '@rocket.chat/ui-contexts';
import type { Meteor } from 'meteor/meteor';
import type { ContextType, ReactNode } from 'react';
import { useMemo, useSyncExternalStore } from 'react';

import { loginServices } from '../../lib/loginServices';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';
import { STORAGE_KEYS, getStoredItem, removeStoredItem } from '../../lib/sdk/storage';
import {
	callLoginMethod,
	getLoginWithMethod,
	isLoggingIn as getLoggingInSnapshot,
	loginWithToken,
	setConnectionUserId,
	subscribeLoggingIn,
} from '../../meteor/accounts';

export type LoginMethods = keyof typeof Meteor extends infer T ? (T extends `loginWith${string}` ? T : never) : never;

export type AuthenticationProviderProps = {
	children: ReactNode;
};

const AuthenticationProvider = ({ children }: AuthenticationProviderProps) => {
	const isLdapEnabled = useSetting('LDAP_Enable', false);

	const loginMethod: LoginMethods = isLdapEnabled ? 'loginWithLDAP' : 'loginWithPassword';

	const isLoggingIn = useSyncExternalStore(subscribeLoggingIn, getLoggingInSnapshot);

	const contextValue = useMemo(
		(): ContextType<typeof AuthenticationContext> => ({
			isLoggingIn,
			loginWithToken: (token: string, callback): Promise<void> =>
				loginWithToken(token).catch((err) => {
					console.error(err);
					callback?.(err);
					throw err;
				}),
			loginWithPassword: (user: string | { username: string } | { email: string } | { id: string }, password: string): Promise<void> =>
				new Promise((resolve, reject) => {
					const method = getLoginWithMethod(loginMethod);
					if (!method) {
						throw new Error(`Meteor.${loginMethod} is not defined`);
					}
					method(user, password, (error?: unknown) => {
						if (error) {
							reject(error);
							return;
						}

						resolve();
					});
				}),
			loginWithService: <T extends LoginServiceConfiguration>(serviceConfig: T): (() => Promise<true>) => {
				const { service: serviceName } = serviceConfig;
				const clientConfig = ('clientConfig' in serviceConfig && serviceConfig.clientConfig) || {};

				const loginWithService = `loginWith${capitalize(String(serviceName || ''))}`;

				const method = getLoginWithMethod(loginWithService);

				if (!method) {
					return () => Promise.reject(new Error('Login method not found'));
				}

				return () =>
					new Promise((resolve, reject) => {
						method(clientConfig, (error: any): void => {
							if (!error) {
								resolve(true);
								return;
							}
							reject(error);
						});
					});
			},
			loginWithIframe: (token: string, callback) =>
				callLoginMethod({ methodArguments: [{ iframe: true, token }] }).catch((error) => {
					console.error(error);
					callback?.(error);
					throw error;
				}),
			loginWithTokenRoute: (token: string, callback) =>
				callLoginMethod({ methodArguments: [{ token }] }).catch((error) => {
					console.error(error);
					callback?.(error);
					throw error;
				}),
			getLoginToken: () => getStoredItem(STORAGE_KEYS.LOGIN_TOKEN),
			wipeLocalAuth: () => {
				removeStoredItem(STORAGE_KEYS.USER_ID);
				removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
				removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES);
				try {
					setConnectionUserId(null);
				} catch {
					// ignore
				}
			},
			unstoreLoginToken: (callback) => getDdpSdk().account.onLogout(callback),
			queryLoginServices: {
				getCurrentValue: () => loginServices.getLoginServiceButtons(),
				subscribe: (onStoreChange: () => void) => loginServices.on('changed', onStoreChange),
			},
		}),
		[isLoggingIn, loginMethod],
	);

	return <AuthenticationContext.Provider value={contextValue}>{children}</AuthenticationContext.Provider>;
};

export default AuthenticationProvider;
