import { capitalize } from '@rocket.chat/string-helpers';

import { OAuthEEManager } from '../lib/oauth/Manager';
import { onLicense } from '../../app/license/server';
import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../../app/settings/server';
import { Logger } from '../../../app/logger/server';

interface IOAuthUserService {
	serviceName: string;
	serviceData: Record<string, any>;
	user: Record<string, any>;
}

interface IOAuthUserIdentity {
	serviceName: string;
	identity: Record<string, any>;
	user: Record<string, any>;
}

interface IOAuthSettings {
	mapChannels: string;
	mergeRoles: string;
	rolesToSync: string;
	rolesClaim: string;
	groupsClaim: string;
	channelsAdmin: string;
	channelsMap: string;
}

const logger = new Logger('EECustomOAuth');

function getOAuthSettings(serviceName: string): IOAuthSettings {
	return {
		mapChannels: settings.get(`Accounts_OAuth_Custom-${serviceName}-map_channels`) as string,
		mergeRoles: settings.get(`Accounts_OAuth_Custom-${serviceName}-merge_roles`) as string,
		rolesToSync: settings.get(`Accounts_OAuth_Custom-${serviceName}-roles_to_sync`) as string,
		rolesClaim: settings.get(`Accounts_OAuth_Custom-${serviceName}-roles_claim`) as string,
		groupsClaim: settings.get(`Accounts_OAuth_Custom-${serviceName}-groups_claim`) as string,
		channelsAdmin: settings.get(`Accounts_OAuth_Custom-${serviceName}-channels_admin`) as string,
		channelsMap: settings.get(`Accounts_OAuth_Custom-${serviceName}-channels_map`) as string,
	};
}

function getChannelsMap(channelsMap: string): Record<string, any> | undefined {
	channelsMap = (channelsMap || '{}').trim();

	try {
		return JSON.parse(channelsMap);
	} catch (err) {
		logger.error(`Unexpected error : ${err}`);
	}
}

onLicense('oauth-enterprise', () => {
	callbacks.add('afterProcessOAuthUser', (auth: IOAuthUserService) => {
		auth.serviceName = capitalize(auth.serviceName);
		const settings = getOAuthSettings(auth.serviceName);

		if (settings.mapChannels) {
			const channelsMap = getChannelsMap(settings.channelsMap);
			OAuthEEManager.mapSSOGroupsToChannels(auth.user, auth.serviceData, settings.groupsClaim, channelsMap, settings.channelsAdmin);
		}

		if (settings.mergeRoles) {
			OAuthEEManager.updateRolesFromSSO(
				auth.user,
				auth.serviceData,
				settings.rolesClaim,
				settings.rolesToSync.split(',').map((role) => role.trim()),
			);
		}
	});

	callbacks.add('afterValidateNewOAuthUser', (auth: IOAuthUserIdentity) => {
		auth.serviceName = capitalize(auth.serviceName);
		const settings = getOAuthSettings(auth.serviceName);

		if (settings.mapChannels) {
			const channelsMap = getChannelsMap(settings.channelsMap);
			OAuthEEManager.mapSSOGroupsToChannels(auth.user, auth.identity, settings.groupsClaim, channelsMap, settings.channelsAdmin);
		}

		if (settings.mergeRoles) {
			auth.user.roles = OAuthEEManager.mapRolesFromSSO(auth.identity, settings.rolesClaim);
		}
	});
});
