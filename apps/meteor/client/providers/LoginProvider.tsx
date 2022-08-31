import { LoginContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import React, { useMemo, FC } from 'react';

import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

const colorMap = {
	'facebook': '#325c99',
	'twitter': '#02acec',
	'google': '#dd4b39',
	'github': '#4c4c4c',
	'gitlab': '#373d47',
	'trello': '#026aa7',
	'meteor-developer': '#de4f4f',
	'wordpress': '#1e8cbe',
	'linkedin': '#1b86bc',
} as const;

const LoginProvider: FC = ({ children }) => {
	const contextValue = useMemo(
		() => ({
			loginWithService: <T extends { service: string; clientConfig?: unknown }>(service: T): (() => Promise<true>) => {
				const loginMethods = {
					'meteor-developer': 'MeteorDeveloperAccount',
				};

				const loginWithService = `loginWith${(loginMethods as any)[service.service] || capitalize(String(service.service || ''))}`;

				const method: (config: unknown, cb: (error: any) => void) => Promise<true> = (Meteor as any)[loginWithService] as any;

				if (!method) {
					return () => Promise.reject(new Error('Login method not found'));
				}

				return () =>
					new Promise((resolve, reject) => {
						method(service.clientConfig, (error: any): void => {
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
					.map((service) => {
						switch (service.service) {
							case 'meteor-developer':
								return {
									service,
									displayName: 'Meteor',
									icon: 'meteor',
								};

							case 'github':
								return {
									service,
									displayName: 'GitHub',
									icon: 'github-circled',
								};

							case 'gitlab':
								return {
									service,
									displayName: 'GitLab',
									icon: service.service,
								};

							case 'wordpress':
								return {
									service,
									displayName: 'WordPress',
									icon: service.service,
								};

							default:
								return {
									service,
									displayName: capitalize(String(service.service || '')),
									icon: service.service,
								};
						}
					}),
			),
		}),
		[],
	);

	return <LoginContext.Provider children={children} value={contextValue} />;
};

export default LoginProvider;
