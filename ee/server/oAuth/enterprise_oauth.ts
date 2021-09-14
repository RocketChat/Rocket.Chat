import { capitalize } from '@rocket.chat/string-helpers';

import { EnterpriseOAuthHelpers } from './helpers';
import { onLicense } from '../../app/license/server';
import { callbacks } from '../../../app/callbacks/server';
import { settings } from '../../../app/settings/server';
import { Logger } from '../../../app/logger/server';

interface IUserService {
	serviceName: string;
	serviceData: Record<string, any>;
	user: Record<string, any>;
}

interface IUserIdentity {
	serviceName: string;
	identity: Record<string, any>;
	user: Record<string, any>;
}

interface ISettings {
	mapChannels: string;
	mergeRoles: string;
	rolesClaim: string;
	groupsClaim: string;
	channelsAdmin: string;
	channelsMap: string;
}

const logger = new Logger('EECustomOAuth');

function getOAuthSettings(serviceName: string): ISettings {
	return {
		mapChannels: settings.get(`Accounts_OAuth_Custom-${ serviceName }-map_channels`) as string,
		mergeRoles: settings.get(`Accounts_OAuth_Custom-${ serviceName }-merge_roles`) as string,
		rolesClaim: settings.get(`Accounts_OAuth_Custom-${ serviceName }-roles_claim`) as string,
		groupsClaim: settings.get(`Accounts_OAuth_Custom-${ serviceName }-groups_claim`) as string,
		channelsAdmin: settings.get(`Accounts_OAuth_Custom-${ serviceName }-channels_admin`) as string,
		channelsMap: settings.get(`Accounts_OAuth_Custom-${ serviceName }-channels_map`) as string,
	};
}

function getChannelsMap(channelsMap: string): Record<string, any> | undefined {
	channelsMap = (channelsMap || '{}').trim();

	try {
		return JSON.parse(channelsMap);
	} catch (err) {
		logger.error(`Unexpected error : ${ err }`);
	}
}

onLicense('oAuth-enterprise', () => {
	callbacks.add('afterOAuthUserHook', (auth: IUserService) => {
		auth.serviceName = capitalize(auth.serviceName);

		const settings = getOAuthSettings(auth.serviceName);

		let channelsMap;

		if (settings.mapChannels) {
			channelsMap = getChannelsMap(settings.channelsMap);
		}

		if (settings.mergeRoles) {
			EnterpriseOAuthHelpers.updateRolesFromSSO(auth.user, auth.serviceData, settings.rolesClaim);
		}

		if (settings.mapChannels) {
			EnterpriseOAuthHelpers.mapSSOGroupsToChannels(auth.user, auth.serviceData, settings.groupsClaim, channelsMap, settings.channelsAdmin);
		}
	});

	callbacks.add('afterValidateNewOAuthUser', (auth: IUserIdentity) => {
		auth.serviceName = capitalize(auth.serviceName);

		const settings = getOAuthSettings(auth.serviceName);

		let channelsMap;
		if (settings.mapChannels) {
			channelsMap = getChannelsMap(settings.channelsMap);
		}

		if (settings.mergeRoles) {
			auth.user.roles = EnterpriseOAuthHelpers.mapRolesFromSSO(auth.identity, settings.rolesClaim);
		}

		if (settings.mapChannels) {
			EnterpriseOAuthHelpers.mapSSOGroupsToChannels(auth.user, auth.identity, settings.groupsClaim, channelsMap, settings.channelsAdmin);
		}
	});
});
