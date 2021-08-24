import { Db, Collection } from 'mongodb';
import mem from 'mem';

import { IAuthorization, RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { AuthorizationUtils } from '../../../app/authorization/lib/AuthorizationUtils';
import { IUser } from '../../../definition/IUser';
import { canAccessRoom } from './canAccessRoom';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { SettingsRaw } from '../../../app/models/server/raw/Settings';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { TeamMemberRaw } from '../../../app/models/server/raw/TeamMember';
import { TeamRaw } from '../../../app/models/server/raw/Team';
import { RolesRaw } from '../../../app/models/server/raw/Roles';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { IRole } from '../../../definition/IRole';
import { ISubscription } from '../../../definition/ISubscription';

import './canAccessRoomLivechat';
import './canAccessRoomTokenpass';

export let Subscriptions: SubscriptionsRaw;
export let Settings: SettingsRaw;
export let Rooms: RoomsRaw;
export let TeamMembers: TeamMemberRaw;
export let Team: TeamRaw;

// Register as class
export class Authorization extends ServiceClass implements IAuthorization {
	protected name = 'authorization';

	private Permissions: Collection;

	private Users: UsersRaw;

	private Roles: RolesRaw;

	private getRolesCached = mem(this.getRoles.bind(this), { maxAge: 1000, cacheKey: JSON.stringify })

	private rolesHasPermissionCached = mem(this.rolesHasPermission.bind(this), { cacheKey: JSON.stringify, ...process.env.TEST_MODE === 'true' && { maxAge: 1 } })

	constructor(db: Db) {
		super();

		this.Permissions = db.collection('rocketchat_permissions');

		this.Users = new UsersRaw(db.collection('users'));
		this.Roles = new RolesRaw(db.collection('rocketchat_roles'));

		Subscriptions = new SubscriptionsRaw(db.collection('rocketchat_subscription'));
		Settings = new SettingsRaw(db.collection('rocketchat_settings'));
		Rooms = new RoomsRaw(db.collection('rocketchat_room'));
		TeamMembers = new TeamMemberRaw(db.collection('rocketchat_team_member'));
		Team = new TeamRaw(db.collection('rocketchat_team'));

		const clearCache = (): void => {
			mem.clear(this.getRolesCached);
			mem.clear(this.rolesHasPermissionCached);
		};

		this.onEvent('watch.roles', clearCache);
		this.onEvent('permission.changed', clearCache);
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

	async addRoleRestrictions(role: string, permissions: string[]): Promise<void> {
		AuthorizationUtils.addRolePermissionWhiteList(role, permissions);
	}

	async getUsersFromPublicRoles(): Promise<Pick<IUser, '_id' | 'username' | 'roles'>[]> {
		const roleIds = await this.getPublicRoles();

		return this.getUserFromRoles(roleIds);
	}

	private getPublicRoles = mem(async (): Promise<string[]> => {
		const roles = await this.Roles.find<Pick<IRole, '_id'>>({ scope: 'Users', description: { $exists: 1, $ne: '' } }, { projection: { _id: 1 } }).toArray();

		return roles.map(({ _id }) => _id);
	}, { maxAge: 10000 });

	private getUserFromRoles = mem(async (roleIds: string[]) => {
		const options = {
			sort: {
				username: 1,
			},
			projection: {
				username: 1,
				roles: 1,
			},
		};

		const users = await this.Users.findUsersInRoles(roleIds, null, options).toArray();

		return users
			.map((user) => ({
				...user,
				roles: user.roles.filter((roleId: string) => roleIds.includes(roleId)),
			}));
	}, { maxAge: 10000 });

	private async rolesHasPermission(permission: string, roles: string[]): Promise<boolean> {
		if (AuthorizationUtils.isPermissionRestrictedForRoleList(permission, roles)) {
			return false;
		}

		const result = await this.Permissions.findOne({ _id: permission, roles: { $in: roles } }, { projection: { _id: 1 } });
		return !!result;
	}

	private async getRoles(uid: string, scope?: string): Promise<string[]> {
		const { roles: userRoles = [] } = await this.Users.findOneById(uid, { projection: { roles: 1 } }) || {};
		const { roles: subscriptionsRoles = [] } = (scope && await Subscriptions.findOne<Pick<ISubscription, 'roles'>>({ rid: scope, 'u._id': uid }, { projection: { roles: 1 } })) || {};
		return [...userRoles, ...subscriptionsRoles].sort((a, b) => a.localeCompare(b));
	}

	private async atLeastOne(uid: string, permissions: string[] = [], scope?: string): Promise<boolean> {
		const sortedRoles = await this.getRolesCached(uid, scope);
		for (const permission of permissions) {
			if (await this.rolesHasPermissionCached(permission, sortedRoles)) { // eslint-disable-line
				return true;
			}
		}

		return false;
	}

	private async all(uid: string, permissions: string[] = [], scope?: string): Promise<boolean> {
		const sortedRoles = await this.getRolesCached(uid, scope);
		for (const permission of permissions) {
			if (!await this.rolesHasPermissionCached(permission, sortedRoles)) { // eslint-disable-line
				return false;
			}
		}

		return true;
	}
}
