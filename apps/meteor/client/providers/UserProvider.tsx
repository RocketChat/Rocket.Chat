import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { LoginService } from '@rocket.chat/ui-contexts';
import { UserContext, useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { FC } from 'react';
import React, { useEffect, useMemo } from 'react';

import { Subscriptions, Rooms } from '../../app/models/client';
import { getUserPreference } from '../../app/utils/client';
import { callbacks } from '../../lib/callbacks';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';
import { call } from '../lib/utils/call';

const getUserId = (): string | null => Meteor.userId();

const getUser = (): IUser | null => Meteor.user() as IUser | null;

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

const logout = (): Promise<void> =>
	new Promise((resolve, reject) => {
		const user = getUser();

		if (!user) {
			return resolve();
		}

		Meteor.logout(() => {
			callbacks.run('afterLogoutCleanUp', user);
			call('logoutCleanUp', user).then(resolve, reject);
		});
	});

type LoginMethods = keyof typeof Meteor;

const UserProvider: FC = ({ children }) => {
	const isLdapEnabled = Boolean(useSetting('LDAP_Enable'));
	const isCrowdEnabled = Boolean(useSetting('CROWD_Enable'));

	const userId = useReactiveValue(getUserId);
	const user = useReactiveValue(getUser);

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
			userId,
			user,
			queryPreference: createReactiveSubscriptionFactory(
				<T,>(key: string, defaultValue?: T) => getUserPreference(userId, key, defaultValue) as T,
			),
			querySubscription: createReactiveSubscriptionFactory<ISubscription | undefined>((query, fields) =>
				Subscriptions.findOne(query, { fields }),
			),
			queryRoom: createReactiveSubscriptionFactory<IRoom | undefined>((query, fields) => Rooms.findOne(query, { fields })),
			querySubscriptions: createReactiveSubscriptionFactory<Array<ISubscription> | []>((query, options) =>
				(userId ? Subscriptions : Rooms).find(query, options).fetch(),
			),
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
			loginWithService: <T extends LoginService>({ service, clientConfig = {} }: T): (() => Promise<true>) => {
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
		[userId, user, loginMethod],
	);

	return <UserContext.Provider children={children} value={contextValue} />;
};

export default UserProvider;
