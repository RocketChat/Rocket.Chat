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

			if (service === 'github_enterprise') {
				const clientId = settings.get<string>('Accounts_OAuth_GitHub_Enterprise_id');
				const clientSecret = settings.get<string>('Accounts_OAuth_GitHub_Enterprise_secret');
				const serverUrl = settings.get<string>('API_GitHub_Enterprise_URL');

				if (!clientId || !clientSecret || !serverUrl) {
					return;
				}

				return {
					provider: service,
					clientId,
					clientSecret,
					authorizationURL: `${serverUrl}/login/oauth/authorize`,
					tokenURL: `${serverUrl}/login/oauth/access_token`,
					userProfileURL: `${serverUrl}/api/v3/user`,
					strategy: OAuthConfigs.github_enterprise.strategy,
					scope: OAuthConfigs.github_enterprise.scope,
				};
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
