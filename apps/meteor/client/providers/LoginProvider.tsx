import { LoginContext, LoginService } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import React, { useMemo, FC } from 'react';

import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

const config: Record<string, {}> = {
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

const LoginProvider: FC = ({ children }) => {
	const contextValue = useMemo(
		() => ({
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
		[],
	);

	return <LoginContext.Provider children={children} value={contextValue} />;
};

export default LoginProvider;
