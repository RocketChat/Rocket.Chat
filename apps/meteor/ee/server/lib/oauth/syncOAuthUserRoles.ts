import type { IRole } from '@rocket.chat/core-typings';

export type OAuthRoleSyncDependencies = {
	findRoles: (names: string[]) => Promise<Array<{ _id: IRole['_id'] }>>;
	mapRolesFromSSO: (identity: Record<string, any>, roleClaimName: string) => Promise<string[]>;
	syncUserRoles: (userId: string, roleIds: IRole['_id'][], options: { allowedRoles: IRole['_id'][] }) => Promise<void>;
};

export type OAuthRoleSyncOptions = {
	user: Record<string, any>;
	identity: Record<string, any>;
	roleClaimName: string;
	rolesToSync: string | string[] | undefined;
};

export async function _syncOAuthUserRoles(deps: OAuthRoleSyncDependencies, options: OAuthRoleSyncOptions): Promise<void> {
	const { user, identity, roleClaimName, rolesToSync } = options;
	if (!user || !identity || !roleClaimName) {
		return;
	}

	const rolesFromSSO = await deps.mapRolesFromSSO(identity, roleClaimName);
	const rolesIdsFromSSO = await deps.findRoles(rolesFromSSO);
	const rolesToSyncSetting = rolesToSync ?? '';
	const normalizedRolesToSync =
		typeof rolesToSyncSetting === 'string' ? rolesToSyncSetting.split(',').map((role) => role.trim()) : rolesToSyncSetting.map((role) => role.trim());
	const allowedRoles = (await deps.findRoles(normalizedRolesToSync)).map((role) => role._id);

	if (!Array.isArray(user.roles)) {
		user.roles = [];
	}

	await deps.syncUserRoles(
		user._id,
		rolesIdsFromSSO.map((role) => role._id),
		{ allowedRoles },
	);
}
