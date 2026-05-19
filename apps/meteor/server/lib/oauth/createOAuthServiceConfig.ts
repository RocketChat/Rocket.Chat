import { capitalize } from '@rocket.chat/string-helpers';
import { isTruthy } from '@rocket.chat/tools';
import type { Strategy } from 'passport';

import { OAuthConfigs } from './oauthConfigs';
import { type ICachedSettings } from '../../../app/settings/server/CachedSettings';

export type OAuthServiceConfig = {
	provider: string;
	strategy: new (...args: any[]) => Strategy;
	clientId: string;
	clientSecret: string;
	scope?: string[];
};

export const createOAuthServiceConfig = (settings: ICachedSettings, services: string[]): OAuthServiceConfig[] => {
	return services
		.map((service) => {
			if (!OAuthConfigs[service]) {
				return;
			}
			return {
				provider: service,
				clientId: settings.get<string>(`Accounts_OAuth_${capitalize(service)}_id`),
				clientSecret: settings.get<string>(`Accounts_OAuth_${capitalize(service)}_secret`),
				...OAuthConfigs[service],
			};
		})
		.filter(isTruthy);
};
