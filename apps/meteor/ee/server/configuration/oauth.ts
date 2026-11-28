import type { IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { capitalize } from '@rocket.chat/tools';

import { callbacks } from '../../../server/lib/callbacks';
import { settings } from '../../../server/settings';
import { OAuthEEManager, syncOAuthUserRoles } from '../lib/oauth/Manager';

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
		rolesToSync: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-roles_to_sync`) ?? '',
		rolesClaim: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-roles_claim`),
		groupsClaim: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-groups_claim`),
		channelsAdmin: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-channels_admin`),
		channelsMap: settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-groups_channel_map`),
	};
}

function getChannelsMap(channelsMap: string): Record<string, any> | undefined {
	channelsMap = (channelsMap || '{}').trim();

	try {
		const parsed: Record<string, unknown> = JSON.parse(channelsMap);
		return parsed;
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
				settings.rolesToSync,
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
			await syncOAuthUserRoles({
				user: auth.user,
				identity: auth.identity,
				roleClaimName: settings.rolesClaim,
				rolesToSync: settings.rolesToSync,
			});
		}
	});
});
