import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { LoginService } from '@rocket.chat/ui-contexts';
import { AuthenticationContext, useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ContextType, ReactElement, ReactNode } from 'react';
import React, { useMemo } from 'react';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';
import { useLDAPAndCrowdCollisionWarning } from './UserProvider/hooks/useLDAPAndCrowdCollisionWarning';

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

const config: Record<string, Partial<LoginService>> = {
	'apple': { title: 'Apple', icon: 'apple' },
	'facebook': { title: 'Facebook', icon: 'facebook' },
	'twitter': { title: 'Twitter', icon: 'twitter' },
	'google': { title: 'Google', icon: 'google' },
	'github': { title: 'Github', icon: 'github' },
	'github_enterprise': { title: 'Github Enterprise', icon: 'github' },
	'gitlab': { title: 'Gitlab', icon: 'gitlab' },
	'dolphin': { title: 'Dolphin', icon: 'dophin' },
	'drupal': { title: 'Drupal', icon: 'drupal' },
	'nextcloud': { title: 'Nextcloud', icon: 'nextcloud' },
	'tokenpass': { title: 'Tokenpass', icon: 'tokenpass' },
	'meteor-developer': { title: 'Meteor', icon: 'meteor' },
	'wordpress': { title: 'WordPress', icon: 'wordpress' },
	'linkedin': { title: 'Linkedin', icon: 'linkedin' },
};

export type LoginMethods = keyof typeof Meteor extends infer T ? (T extends `loginWith${string}` ? T : never) : never;

type UserProviderProps = {
	children: ReactNode;
};

const UserProvider = ({ children }: UserProviderProps): ReactElement => {
	const isLdapEnabled = useSetting<boolean>('LDAP_Enable');
	const isCrowdEnabled = useSetting<boolean>('CROWD_Enable');

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
			queryAllServices: createReactiveSubscriptionFactory(() =>
				ServiceConfiguration.configurations
					.find(
						{
							showButton: { $ne: false },
						},
						{
							sort: {
								service: 1,
							},
						},
					)
					.fetch()
					.map(
						({ appId: _, ...service }) =>
							({
								title: capitalize(String((service as any).service || '')),
								...service,
								...(config[(service as any).service] ?? {}),
							} as any),
					),
			),
		}),
		[loginMethod],
	);

	return <AuthenticationContext.Provider children={children} value={contextValue} />;
};

export default UserProvider;
