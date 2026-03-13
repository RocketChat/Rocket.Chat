import { capitalize } from '@rocket.chat/string-helpers';

import { strategyMap, type Provider } from './strategiesMap';
import { type ICachedSettings } from '../../../app/settings/server/CachedSettings';

export const createOAuthServiceConfig = (settings: ICachedSettings, services: string[]) => {
	return services.map((service) => {
		return {
			provider: service,
			strategy: strategyMap[service as Provider],
			clientId: settings.get<string>(`Accounts_OAuth_${capitalize(service)}_id`),
			clientSecret: settings.get<string>(`Accounts_OAuth_${capitalize(service)}_secret`),
		};
	});
};
