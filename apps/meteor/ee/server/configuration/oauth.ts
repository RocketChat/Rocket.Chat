import type { IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { Roles } from '@rocket.chat/models';
import { capitalize } from '@rocket.chat/string-helpers';

import { settings } from '../../../app/settings/server';
import { callbacks } from '../../../lib/callbacks';
import { OAuthEEManager } from '../lib/oauth/Manager';
import { syncUserRoles } from '../lib/syncUserRoles';

interface IOAuthUserService {
	serviceName: string;
	serviceData: Record<string, any>;
	user: IUser;
}

interface IOAuthUserIdentity {
	serviceName: string;
	identity: Record<string, any>;
	user: IUser;
}

interface IOAuthSettings {
	mapChannels: boolean;
	mergeRoles: boolean;
	rolesToSync: string;
	rolesClaim: string;
	groupsClaim: string;
	channelsAdmin: string;
	channelsMap: string;
}

const logger = new Logger('EECustomOAuth');

function getOAuthSettings(serviceName: string): IOAuthSettings {
	return {
		mapChannels: settings.get<boolean>(`Accounts_OAuth_Custom-${serviceName}-map_channels`),
		mergeRoles: settings.get<boolean>(`Accounts_OAuth_Custom-${serviceName}-merge_roles`),
		rolesToSync: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-roles_to_sync`),
		rolesClaim: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-roles_claim`),
		groupsClaim: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-groups_claim`),
		channelsAdmin: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-channels_admin`),
		channelsMap: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-groups_channel_map`),
	};
}

function getChannelsMap(channelsMap: string): Record<string, any> | undefined {
	channelsMap = (channelsMap || '{}').trim();

	try {
		return JSON.parse(channelsMap);
	} catch (err) {
		logger.error({ msg: 'Unexpected error', err });
	}
}

await License.onLicense('oauth-enterprise', () => {
	callbacks.add('afterProcessOAuthUser', async (auth: IOAuthUserService) => {
		auth.serviceName = capitalize(auth.serviceName);
		const settings = getOAuthSettings(auth.serviceName);

		if (settings.mapChannels) {
			const channelsMap = getChannelsMap(settings.channelsMap);
			await OAuthEEManager.mapSSOGroupsToChannels(auth.user, auth.serviceData, settings.groupsClaim, channelsMap, settings.channelsAdmin);
		}

		if (settings.mergeRoles) {
			await OAuthEEManager.updateRolesFromSSO(
				auth.user,
				auth.serviceData,
				settings.rolesClaim,
				settings.rolesToSync.split(',').map((role) => role.trim()),
			);
		}
	});

	callbacks.add('afterValidateNewOAuthUser', async (auth: IOAuthUserIdentity) => {
		auth.serviceName = capitalize(auth.serviceName);
		const settings = getOAuthSettings(auth.serviceName);

		if (settings.mapChannels) {
			const channelsMap = getChannelsMap(settings.channelsMap);
			await OAuthEEManager.mapSSOGroupsToChannels(auth.user, auth.identity, settings.groupsClaim, channelsMap, settings.channelsAdmin);
		}

		if (settings.mergeRoles) {
			const rolesFromSSO = await OAuthEEManager.mapRolesFromSSO(auth.identity, settings.rolesClaim);
			const mappedRoles = (await Roles.findInIdsOrNames(rolesFromSSO).toArray()).map((role) => role._id);
			const rolesToSync = settings.rolesToSync.split(',').map((role) => role.trim());

			const allowedRoles = (await Roles.findInIdsOrNames(rolesToSync).toArray()).map((role) => role._id);

			await syncUserRoles(auth.user._id, mappedRoles, {
				allowedRoles,
			});
		}
	});
});
