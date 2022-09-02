import { IUser } from '@rocket.chat/core-typings';
import { LoginContext, LoginService, useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import React, { useMemo, FC, useEffect } from 'react';

import { callbacks } from '../../lib/callbacks';
import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

const config: Record<string, Partial<LoginService>> = {
	'facebook': { buttonColor: '#325c99' },
	'twitter': { buttonColor: '#02acec' },
	'google': { buttonColor: '#dd4b39' },
	'github': { buttonColor: '#4c4c4c', title: 'GitHub' },
	'github_enterprise': { buttonColor: '#4c4c4c', title: 'GitHub Enterprise' },
	'gitlab': { buttonColor: '#373d47', title: 'GitLab' },
	'trello': { buttonColor: '#026aa7' },
	'meteor-developer': { buttonColor: '#de4f4f', title: 'Meteor' },
	'wordpress': { buttonColor: '#1e8cbe', title: 'WordPress' },
	'linkedin': { buttonColor: '#1b86bc' },
};

const getUser = (): IUser | null => Meteor.user() as IUser | null;

const logout = (): Promise<void> =>
	new Promise((resolve) => {
		const user = getUser();

		if (!user) {
			return resolve();
		}

		Meteor.logout(() => {
			callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user, resolve);
		});
	});

type LoginMethods = keyof typeof Meteor;

const LoginProvider: FC = ({ children }) => {
	const isLdapEnabled = Boolean(useSetting('LDAP_Enable'));
	const isCrowdEnabled = Boolean(useSetting('CROWD_Enable'));

	const loginMethod: LoginMethods = (isLdapEnabled && 'loginWithLDAP') || (isCrowdEnabled && 'loginWithCrowd') || 'loginWithPassword';

	useEffect(() => {
		if (isLdapEnabled && isCrowdEnabled) {
			if (process.env.NODE_ENV === 'development') {
				throw new Error('You can not use both LDAP and Crowd at the same time');
			}
			console.log('Both LDAP and Crowd are enabled. Please disable one of them.');
		}
		if (!Meteor[loginMethod]) {
			if (process.env.NODE_ENV === 'development') {
				throw new Error(`Meteor.${loginMethod} is not defined`);
			}
			console.log(`Meteor.${loginMethod} is not defined`);
		}
	}, [isLdapEnabled, isCrowdEnabled, loginMethod]);

	const contextValue = useMemo(
		() => ({
			loginWithToken: (token: string): Promise<void> =>
				new Promise((resolve, reject) =>
					Meteor.loginWithToken(token, (err) => {
						if (err) {
							return reject(err);
						}
						resolve(undefined);
					}),
				),
			loginWithPassword: (user: string | object, password: string): Promise<void> =>
				new Promise((resolve, reject) => {
					Meteor[loginMethod](user, password, (error: Error | Meteor.Error | Meteor.TypedError | undefined) => {
						if (error) {
							reject(error);
							return;
						}

						resolve();
					});
				}),
			logout,
			loginWithService: <T extends LoginService>({ service, clientConfig }: T): (() => Promise<true>) => {
				const loginMethods = {
					'meteor-developer': 'MeteorDeveloperAccount',
				};

				const loginWithService = `loginWith${(loginMethods as any)[service] || capitalize(String(service || ''))}`;

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
					.map(({ appId: _, ...service }) => ({
						title: capitalize(String(service.service || '')),
						...service,
						...(config[service.service] ?? {}),
					})),
			),
		}),
		[loginMethod],
	);

	return <LoginContext.Provider children={children} value={contextValue} />;
};

export default LoginProvider;
