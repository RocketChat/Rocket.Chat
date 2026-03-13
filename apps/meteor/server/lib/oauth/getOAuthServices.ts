import { isTruthy } from '@rocket.chat/tools';

import { strategyMap, type Provider } from './strategiesMap';
import { type ICachedSettings } from '../../../app/settings/server/CachedSettings';

export const getOAuthServices = (settings: ICachedSettings) => {
	const services = settings.getByRegexp(/^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i);
	const filteredServices = services.filter(([, value]) => typeof value === 'boolean' && value === true);
	return filteredServices
		.map(([key, value]) => {
			if (!value) {
				return;
			}

			let serviceName = key.replace('Accounts_OAuth_', '');
			if (serviceName === 'Meteor') {
				serviceName = 'meteor-developer';
			}
			if (/Accounts_OAuth_Custom-/.test(key)) {
				return;
			}

			const serviceKey = serviceName.toLowerCase();

			const oauthStrategy = strategyMap[serviceKey as Provider];
			if (!oauthStrategy) {
				return;
			}

			return serviceKey;
		})
		.filter(isTruthy);
};
