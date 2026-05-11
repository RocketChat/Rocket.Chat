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
	teamID?: string;
	keyID?: string;
	privateKeyString?: string;
};

export const createOAuthServiceConfig = (settings: ICachedSettings, services: string[]): OAuthServiceConfig[] => {
	return services.map((service) => {
		if (service === 'apple') {
			return {
				provider: service,
				strategy: OAuthConfigs[service].strategy,
				scope: OAuthConfigs[service].scope,
				clientId: settings.get<string>('Accounts_OAuth_Apple_id'),
				teamID: settings.get<string>('Accounts_OAuth_Apple_iss'),
				keyID: settings.get<string>('Accounts_OAuth_Apple_kid'),
				privateKeyString: settings.get<string>('Accounts_OAuth_Apple_secretKey').replace(/\\n/g, '\n'),
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
