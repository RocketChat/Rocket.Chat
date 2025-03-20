import type { IAuthorization, RoomAccessValidator } from '@rocket.chat/core-services';
import { License, ServiceClass } from '@rocket.chat/core-services';
import type { IUser, IRole, IRoom, ISubscription, IRocketChatRecord } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms, Users, Roles, Permissions } from '@rocket.chat/models';
import mem from 'mem';

import { canAccessRoom } from './canAccessRoom';
import { canReadRoom } from './canReadRoom';
import { AuthorizationUtils } from '../../../app/authorization/lib/AuthorizationUtils';

import './canAccessRoomLivechat';

// Register as class
export class Authorization extends ServiceClass implements IAuthorization {
	protected name = 'authorization';

	private getRolesCached = mem(this.getRoles.bind(this), {
		maxAge: 1000,
		cacheKey: JSON.stringify,
	});

	private rolesHasPermissionCached = mem(this.rolesHasPermission.bind(this), {
		cacheKey: JSON.stringify,
		...(process.env.TEST_MODE === 'true' && { maxAge: 1 }),
	});

	constructor() {
		super();

		const clearCache = (): void => {
			mem.clear(this.getRolesCached);
			mem.clear(this.rolesHasPermissionCached);
		};

		this.onEvent('watch.roles', clearCache);
		this.onEvent('permission.changed', clearCache);
		this.onEvent('authorization.guestPermissions', (permissions: string[]) => {
			AuthorizationUtils.addRolePermissionWhiteList('guest', permissions);
		});
	}

	async started(): Promise<void> {
		try {
			if (!(await License.hasValidLicense())) {
				return;
			}

			const permissions = await License.getGuestPermissions();
			if (!permissions) {
				return;
			}

			AuthorizationUtils.addRolePermissionWhiteList('guest', permissions);
		} catch (error) {
			console.error('Authorization Service did not start correctly', error);
		}
	}

	async hasAllPermission(userId: string, permissions: string[], scope?: string): Promise<boolean> {
		if (!userId) {
			return false;
		}
		return this.all(userId, permissions, scope);
	}

	async hasPermission(userId: string, permissionId: string, scope?: string): Promise<boolean> {
		if (!userId) {
			return false;
		}
		return this.all(userId, [permissionId], scope);
	}

	async hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): Promise<boolean> {
		if (!userId) {
			return false;
		}
		return this.atLeastOne(userId, permissions, scope);
	}

	async canAccessRoom(...args: Parameters<RoomAccessValidator>): Promise<boolean> {
		return canAccessRoom(...args);
	}

	async canReadRoom(...args: Parameters<RoomAccessValidator>): Promise<boolean> {
		return canReadRoom(...args);
	}

	async canAccessRoomId(rid: IRoom['_id'], uid: IUser['_id']): Promise<boolean> {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'teamId' | 'prid'>>(rid, {
			projection: {
				_id: 1,
				t: 1,
				teamId: 1,
				prid: 1,
			},
		});

		if (!room) {
			return false;
		}

		return this.canAccessRoom(room, { _id: uid });
	}

	async addRoleRestrictions(role: IRole['_id'], permissions: string[]): Promise<void> {
		AuthorizationUtils.addRolePermissionWhiteList(role, permissions);
	}

	async getUsersFromPublicRoles(): Promise<(IRocketChatRecord & Pick<IUser, '_id' | 'username' | 'roles'>)[]> {
		const roleIds = await this.getPublicRoles();

		return this.getUserFromRoles(roleIds);
	}

	private getPublicRoles = mem(
		async (): Promise<string[]> => {
			const roles = await Roles.find<Pick<IRole, '_id'>>(
				{ scope: 'Users', description: { $exists: true, $ne: '' } },
				{ projection: { _id: 1 } },
			).toArray();

			return roles.map(({ _id }) => _id);
		},
		{ maxAge: 10000 },
	);

	private getUserFromRoles = mem(
		async (roleIds: string[]) => {
			const users = await Users.findUsersInRoles(roleIds, null, {
				sort: {
					username: 1,
				},
				projection: {
					username: 1,
					roles: 1,
				},
			}).toArray();

			return users.map((user) => ({
				...user,
				roles: user.roles.filter((roleId: string) => roleIds.includes(roleId)),
			}));
		},
		{ maxAge: 10000 },
	);

	private async rolesHasPermission(permission: string, roles: IRole['_id'][]): Promise<boolean> {
		if (AuthorizationUtils.isPermissionRestrictedForRoleList(permission, roles)) {
			return false;
		}

		const result = await Permissions.findOne({ _id: permission, roles: { $in: roles } }, { projection: { _id: 1 } });
		return !!result;
	}

	private async getRoles(uid: string, scope?: IRoom['_id']): Promise<string[]> {
		const { roles: userRoles = [] } = (await Users.findOneById(uid, { projection: { roles: 1 } })) || {};
		const { roles: subscriptionsRoles = [] } =
			(scope &&
				(await Subscriptions.findOne<Pick<ISubscription, 'roles'>>({ 'rid': scope, 'u._id': uid }, { projection: { roles: 1 } }))) ||
			{};
		return [...userRoles, ...subscriptionsRoles].sort((a, b) => a.localeCompare(b));
	}

	private async atLeastOne(uid: string, permissions: string[] = [], scope?: string): Promise<boolean> {
		const sortedRoles = await this.getRolesCached(uid, scope);
		for await (const permission of permissions) {
			if (await this.rolesHasPermissionCached(permission, sortedRoles)) {
				return true;
			}
		}

		return false;
	}

	private async all(uid: string, permissions: string[] = [], scope?: string): Promise<boolean> {
		const sortedRoles = await this.getRolesCached(uid, scope);
		for await (const permission of permissions) {
			if (!(await this.rolesHasPermissionCached(permission, sortedRoles))) {
				return false;
			}
		}

		return true;
	}
}
