import type { IUser } from '@rocket.chat/core-typings';
import { capitalize } from '@rocket.chat/tools';

import type { OAuthEEManager, syncOAuthUserRoles } from '../lib/oauth/Manager';

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

export interface IOAuthSettings {
	mapChannels: boolean;
	mergeRoles: boolean;
	rolesToSync: string;
	rolesClaim: string;
	groupsClaim: string;
	channelsAdmin: string;
	channelsMap: string;
}

export type OAuthCallbackDependencies = {
	settings: {
		get<T>(key: string): T;
	};
	oAuthEEManager: {
		mapSSOGroupsToChannels: typeof OAuthEEManager.mapSSOGroupsToChannels;
		updateRolesFromSSO: typeof OAuthEEManager.updateRolesFromSSO;
	};
	syncOAuthUserRoles: typeof syncOAuthUserRoles;
	logger: { error: (value: unknown) => void };
};

export function getOAuthSettings(deps: OAuthCallbackDependencies, serviceName: string): IOAuthSettings {
	return {
		mapChannels: deps.settings.get<boolean>(`Accounts_OAuth_Custom-${serviceName}-map_channels`),
		mergeRoles: deps.settings.get<boolean>(`Accounts_OAuth_Custom-${serviceName}-merge_roles`),
		rolesToSync: deps.settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-roles_to_sync`) ?? '',
		rolesClaim: deps.settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-roles_claim`),
		groupsClaim: deps.settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-groups_claim`),
		channelsAdmin: deps.settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-channels_admin`),
		channelsMap: deps.settings.get<string>(`Accounts_OAuth_Custom-${serviceName}-groups_channel_map`),
	};
}

export function getChannelsMap(deps: OAuthCallbackDependencies, channelsMap: string): Record<string, unknown> | undefined {
	channelsMap = (channelsMap || '{}').trim();

	try {
		return JSON.parse(channelsMap) as Record<string, unknown>;
	} catch (err) {
		deps.logger.error({ msg: 'Unexpected error', err });
	}
}

export function createOAuthCallbacks(deps: OAuthCallbackDependencies) {
	return {
		afterProcessOAuthUser: async (auth: IOAuthUserService): Promise<void> => {
			auth.serviceName = capitalize(auth.serviceName);
			const oauthSettings = getOAuthSettings(deps, auth.serviceName);

			if (oauthSettings.mapChannels) {
				const channelsMap = getChannelsMap(deps, oauthSettings.channelsMap);
				await deps.oAuthEEManager.mapSSOGroupsToChannels(auth.user, auth.serviceData, oauthSettings.groupsClaim, channelsMap, oauthSettings.channelsAdmin);
			}

			if (oauthSettings.mergeRoles) {
				await deps.oAuthEEManager.updateRolesFromSSO(auth.user, auth.serviceData, oauthSettings.rolesClaim, oauthSettings.rolesToSync);
			}
		},
		afterValidateNewOAuthUser: async (auth: IOAuthUserIdentity): Promise<void> => {
			auth.serviceName = capitalize(auth.serviceName);
			const oauthSettings = getOAuthSettings(deps, auth.serviceName);

			if (oauthSettings.mapChannels) {
				const channelsMap = getChannelsMap(deps, oauthSettings.channelsMap);
				await deps.oAuthEEManager.mapSSOGroupsToChannels(auth.user, auth.identity, oauthSettings.groupsClaim, channelsMap, oauthSettings.channelsAdmin);
			}

			if (oauthSettings.mergeRoles) {
				await deps.syncOAuthUserRoles({
					user: auth.user,
					identity: auth.identity,
					roleClaimName: oauthSettings.rolesClaim,
					rolesToSync: oauthSettings.rolesToSync,
				});
			}
		},
	};
}
