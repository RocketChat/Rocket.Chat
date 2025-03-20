import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { capitalize } from '@rocket.chat/string-helpers';
import { AuthenticationContext, useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ContextType, ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import { useLDAPAndCrowdCollisionWarning } from './hooks/useLDAPAndCrowdCollisionWarning';
import { loginServices } from '../../lib/loginServices';

export type LoginMethods = keyof typeof Meteor extends infer T ? (T extends `loginWith${string}` ? T : never) : never;

type AuthenticationProviderProps = {
	children: ReactNode;
};

const AuthenticationProvider = ({ children }: AuthenticationProviderProps): ReactElement => {
	const isLdapEnabled = useSetting('LDAP_Enable', false);
	const isCrowdEnabled = useSetting('CROWD_Enable', false);

	const loginMethod: LoginMethods = (isLdapEnabled && 'loginWithLDAP') || (isCrowdEnabled && 'loginWithCrowd') || 'loginWithPassword';

	useLDAPAndCrowdCollisionWarning();

	const contextValue = useMemo(
		(): ContextType<typeof AuthenticationContext> => ({
			loginWithToken: (token: string): Promise<void> =>
				new Promise((resolve, reject) =>
					Meteor.loginWithToken(token, (err) => {
						if (err) {
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

			queryLoginServices: {
				getCurrentValue: () => loginServices.getLoginServiceButtons(),
				subscribe: (onStoreChange: () => void) => loginServices.on('changed', onStoreChange),
			},
		}),
		[loginMethod],
	);

	return <AuthenticationContext.Provider children={children} value={contextValue} />;
};

export default AuthenticationProvider;
