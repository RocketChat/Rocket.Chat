// import mem from 'mem';
import { Db, Collection } from 'mongodb';

import { IAuthorization } from '../../sdk/types/IAuthorization';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { AuthorizationUtils } from '../../../app/authorization/lib/AuthorizationUtils';
import { IUser } from '../../../definition/IUser';
import { canAccessRoom } from './canAccessRoom';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { SettingsRaw } from '../../../app/models/server/raw/Settings';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';

import './canAccessRoomLivechat';
import './canAccessRoomTokenpass';

export let Subscriptions: SubscriptionsRaw;
export let Settings: SettingsRaw;
export let Rooms: RoomsRaw;

// Register as class
export class Authorization extends ServiceClass implements IAuthorization {
	protected name = 'authorization';

	private Permissions: Collection;

	private Users: Collection;

	constructor(db: Db) {
		super();

		this.Permissions = db.collection('rocketchat_permissions');
		this.Users = db.collection('users');

		Subscriptions = new SubscriptionsRaw(db.collection('rocketchat_subscription'));
		Settings = new SettingsRaw(db.collection('rocketchat_settings'));
		Rooms = new RoomsRaw(db.collection('rocketchat_room'));
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

	canAccessRoom = canAccessRoom;

	private async rolesHasPermission(permission: string, roles: string[]): Promise<boolean> {
		// TODO this AuthorizationUtils should be brought to this service. currently its state is kept on the application only, but it needs to kept here
		if (AuthorizationUtils.isPermissionRestrictedForRoleList(permission, roles)) {
			return false;
		}

		const result = await this.Permissions.findOne({ _id: permission, roles: { $in: roles } }, { projection: { _id: 1 } });
		return !!result;
	}
	// , {
	// 	cacheKey: JSON.stringify,
	// 	...process.env.TEST_MODE === 'true' && { maxAge: 1 },
	// });

	private async getRoles(uid: string, scope?: string): Promise<string[]> {
		const { roles: userRoles = [] } = await this.Users.findOne<IUser>({ _id: uid }, { projection: { roles: 1 } }) || {};
		const { roles: subscriptionsRoles = [] } = (scope && await Subscriptions.findOne({ rid: scope, 'u._id': uid }, { projection: { roles: 1 } })) || {};
		return [...userRoles, ...subscriptionsRoles].sort((a, b) => a.localeCompare(b));
	}
	// , { maxAge: 1000, cacheKey: JSON.stringify });

	// private clearCache = (): void => {
	// 	mem.clear(getRoles);
	// 	mem.clear(rolesHasPermission);
	// }

	private async atLeastOne(uid: string, permissions: string[] = [], scope?: string): Promise<boolean> {
		const sortedRoles = await this.getRoles(uid, scope);
		for (const permission of permissions) {
			if (await this.rolesHasPermission(permission, sortedRoles)) { // eslint-disable-line
				return true;
			}
		}

		return false;
	}

	private async all(uid: string, permissions: string[] = [], scope?: string): Promise<boolean> {
		const sortedRoles = await this.getRoles(uid, scope);
		for (const permission of permissions) {
			if (!await this.rolesHasPermission(permission, sortedRoles)) { // eslint-disable-line
				return false;
			}
		}

		return true;
	}
}
