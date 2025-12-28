import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { capitalize } from '@rocket.chat/string-helpers';
import { AuthenticationContext, useSetting } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import type { ContextType, ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import { useLDAPAndCrowdCollisionWarning } from './hooks/useLDAPAndCrowdCollisionWarning';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { loginServices } from '../../lib/loginServices';

export type LoginMethods = keyof typeof Meteor extends infer T ? (T extends `loginWith${string}` ? T : never) : never;

type AuthenticationProviderProps = {
	children: ReactNode;
};

const callLoginMethod = (
	options: { loginToken?: string; token?: string; iframe?: boolean },
	userCallback: ((err?: any) => void) | undefined,
) => {
	Accounts.callLoginMethod({
		methodArguments: [options],
		userCallback,
	});
};

const getLoggingIn = () => Accounts.loggingIn();

const AuthenticationProvider = ({ children }: AuthenticationProviderProps): ReactElement => {
	const isLdapEnabled = useSetting('LDAP_Enable', false);
	const isCrowdEnabled = useSetting('CROWD_Enable', false);

	const loginMethod: LoginMethods = (isLdapEnabled && 'loginWithLDAP') || (isCrowdEnabled && 'loginWithCrowd') || 'loginWithPassword';

	useLDAPAndCrowdCollisionWarning();

	const isLoggingIn = useReactiveValue(getLoggingIn);

	const contextValue = useMemo(
		(): ContextType<typeof AuthenticationContext> => ({
			isLoggingIn,
			loginWithToken: (token: string, callback): Promise<void> =>
				new Promise((resolve, reject) =>
					Meteor.loginWithToken(token, (err) => {
						if (err) {
							console.error(err);
							callback?.(err);
							return reject(err);
						}
						resolve(undefined);
					}),
				),
			loginWithPassword: (user: string | { username: string } | { email: string } | { id: string }, password: string): Promise<void> =>
				new Promise((resolve, reject) => {
					Meteor[loginMethod](user, password, (error) => {
						if (error) {
							reject(error);
							return;
						}

						resolve();
					});
				}),
			loginWithService: <T extends LoginServiceConfiguration>(serviceConfig: T): (() => Promise<true>) => {
				const loginMethods: Record<string, string | undefined> = {
					'meteor-developer': 'MeteorDeveloperAccount',
				};

				const { service: serviceName } = serviceConfig;
				const clientConfig = ('clientConfig' in serviceConfig && serviceConfig.clientConfig) || {};

				const loginWithService = `loginWith${loginMethods[serviceName] || capitalize(String(serviceName || ''))}`;

				const method: (config: unknown, cb: (error: any) => void) => Promise<true> = (Meteor as any)[loginWithService] as any;

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
				new Promise<void>((resolve, reject) => {
					callLoginMethod({ iframe: true, token }, (error) => {
						if (error) {
							console.error(error);
							callback?.(error);
							return reject(error);
						}
						resolve();
					});
				}),
			loginWithTokenRoute: (token: string, callback) =>
				new Promise<void>((resolve, reject) => {
					callLoginMethod({ token }, (error) => {
						if (error) {
							console.error(error);
							callback?.(error);
							return reject(error);
						}
						resolve();
					});
				}),
			unstoreLoginToken: (callback) => {
				const { _unstoreLoginToken } = Accounts;
				Accounts._unstoreLoginToken = function (...args) {
					callback();
					_unstoreLoginToken.apply(Accounts, args);
				};
				return () => {
					Accounts._unstoreLoginToken = _unstoreLoginToken;
				};
			},
			queryLoginServices: {
				getCurrentValue: () => loginServices.getLoginServiceButtons(),
				subscribe: (onStoreChange: () => void) => loginServices.on('changed', onStoreChange),
			},
		}),
		[isLoggingIn, loginMethod],
	);

	return <AuthenticationContext.Provider children={children} value={contextValue} />;
};

export default AuthenticationProvider;
