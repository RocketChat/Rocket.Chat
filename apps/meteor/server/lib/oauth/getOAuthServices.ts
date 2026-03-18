import { isTruthy } from '@rocket.chat/tools';

import { isBuiltInProvider } from './strategiesMap';
import { type ICachedSettings } from '../../../app/settings/server/CachedSettings';

export interface OAuthServiceInfo {
	name: string;
	custom: boolean;
	settingsKey: string;
}

export const getOAuthServices = (settings: ICachedSettings): OAuthServiceInfo[] => {
	const services = settings.getByRegexp(/^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i);
	const filteredServices = services.filter(([, value]) => typeof value === 'boolean' && value === true);

	return filteredServices
		.map(([key, value]): OAuthServiceInfo | undefined => {
			if (!value) {
				return;
			}

			const isCustom = /^Accounts_OAuth_Custom-/.test(key);

			let serviceName: string;
			if (isCustom) {
				serviceName = key.replace('Accounts_OAuth_Custom-', '');
			} else {
				serviceName = key.replace('Accounts_OAuth_', '');
				if (serviceName === 'Meteor') {
					serviceName = 'meteor-developer';
				}
			}

			const serviceKey = serviceName.toLowerCase();

			if (!isCustom && !isBuiltInProvider(serviceKey)) {
				return;
			}

			return {
				name: serviceKey,
				custom: isCustom,
				settingsKey: key,
			};
		})
		.filter(isTruthy);
};

export const getBuiltInOAuthServices = (settings: ICachedSettings): string[] => {
	return getOAuthServices(settings)
		.filter((service) => !service.custom)
		.map((service) => service.name);
};

export const getCustomOAuthServices = (settings: ICachedSettings): OAuthServiceInfo[] => {
	return getOAuthServices(settings).filter((service) => service.custom);
};
