import { capitalize, isTruthy } from '@rocket.chat/tools';
import type { Strategy } from 'passport';

import { OAuthConfigs } from './oauthConfigs';
import { type ICachedSettings } from '../../settings/CachedSettings';

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

			const clientId = settings.get<string>(`Accounts_OAuth_${capitalize(service)}_id`);
			const clientSecret = settings.get<string>(`Accounts_OAuth_${capitalize(service)}_secret`);

			if (!clientId || !clientSecret) {
				return;
			}

			return {
				provider: service,
				clientId,
				clientSecret,
				...OAuthConfigs[service],
			};
		})
		.filter(isTruthy);
};
