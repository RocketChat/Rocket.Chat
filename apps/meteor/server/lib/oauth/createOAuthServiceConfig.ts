import { capitalize } from '@rocket.chat/string-helpers';
import type { Strategy } from 'passport';

import { OAuthConfigs } from './oauthConfigs';
import { type ICachedSettings } from '../../../app/settings/server/CachedSettings';

export type OAuthServiceConfig = {
	provider: string;
	strategy: new (...args: any[]) => Strategy;
	clientId: string;
	clientSecret?: string;
	scope: string[];
};

export const createOAuthServiceConfig = (settings: ICachedSettings, services: string[]): OAuthServiceConfig[] => {
	return services.map((service) => {
		if (service === 'github_enterprise') {
			return {
				provider: service,
				clientId: settings.get<string>('Accounts_OAuth_GitHub_Enterprise_id'),
				clientSecret: settings.get<string>('Accounts_OAuth_GitHub_Enterprise_secret'),
				authorizationURL: `${settings.get<string>('API_GitHub_Enterprise_URL')}/login/oauth/authorize`,
				tokenURL: `${settings.get<string>('API_GitHub_Enterprise_URL')}/login/oauth/access_token`,
				userProfileURL: `${settings.get<string>('API_GitHub_Enterprise_URL')}/api/v3/user`,
				strategy: OAuthConfigs.github_enterprise.strategy,
				scope: OAuthConfigs.github_enterprise.scope,
			};
		}

		return {
			provider: service,
			strategy: OAuthConfigs[service].strategy,
			clientId: settings.get<string>(`Accounts_OAuth_${capitalize(service)}_id`),
			clientSecret: settings.get<string>(`Accounts_OAuth_${capitalize(service)}_secret`),
			scope: OAuthConfigs[service].scope,
		};
	});
};
