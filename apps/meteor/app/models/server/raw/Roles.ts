import type {
	Collection,
	Cursor,
	FilterQuery,
	FindOneOptions,
	InsertOneWriteOpResult,
	UpdateWriteOpResult,
	WithId,
	WithoutProjection,
} from 'mongodb';
import type { IRole, IUser, IRoom } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';
import { SubscriptionsRaw } from './Subscriptions';
import { UsersRaw } from './Users';

type ScopedModelRoles = {
	Subscriptions: SubscriptionsRaw;
	Users: UsersRaw;
};

export class RolesRaw extends BaseRaw<IRole> {
	constructor(public readonly col: Collection<IRole>, private readonly models: ScopedModelRoles, trash?: Collection<IRole>) {
		super(col, trash);
	}

	findByUpdatedDate(updatedAfterDate: Date, options?: FindOneOptions<IRole>): Cursor<IRole> {
		const query = {
			_updatedAt: { $gte: new Date(updatedAfterDate) },
		};

		return options ? this.find(query, options) : this.find(query);
	}

	async addUserRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean> {
		if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
			throw new Error('Roles.addUserRoles method received a role scope instead of a scope value.');
		}

		if (!Array.isArray(roles)) {
			roles = [roles];
			process.env.NODE_ENV === 'development' && console.warn('[WARN] RolesRaw.addUserRoles: roles should be an array');
		}

		for await (const roleId of roles) {
			const role = await this.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });

			if (!role) {
				process.env.NODE_ENV === 'development' && console.warn(`[WARN] RolesRaw.addUserRoles: role: ${roleId} not found`);
				continue;
			}
			switch (role.scope) {
				case 'Subscriptions':
					await this.models.Subscriptions.addRolesByUserId(userId, [role._id], scope);
					break;
				case 'Users':
				default:
					await this.models.Users.addRolesByUserId(userId, [role._id]);
			}
		}
		return true;
	}

	async isUserInRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean> {
		if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
			throw new Error('Roles.isUserInRoles method received a role scope instead of a scope value.');
		}

		for await (const roleId of roles) {
			const role = await this.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });

			if (!role) {
				continue;
			}

			switch (role.scope) {
				case 'Subscriptions':
					if (await this.models.Subscriptions.isUserInRole(userId, roleId, scope)) {
						return true;
					}
					break;
				case 'Users':
				default:
					if (await this.models.Users.isUserInRole(userId, roleId)) {
						return true;
					}
			}
		}
		return false;
	}

	async removeUserRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean> {
		if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
			throw new Error('Roles.removeUserRoles method received a role scope instead of a scope value.');
		}

		for await (const roleId of roles) {
			const role = await this.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });

			if (!role) {
				continue;
			}

			switch (role.scope) {
				case 'Subscriptions':
					scope && (await this.models.Subscriptions.removeRolesByUserId(userId, [roleId], scope));
					break;
				case 'Users':
				default:
					await this.models.Users.removeRolesByUserId(userId, [roleId]);
			}
		}
		return true;
	}

	async findOneByIdOrName(_idOrName: IRole['_id'] | IRole['name'], options?: undefined): Promise<IRole | null>;

	async findOneByIdOrName(
		_idOrName: IRole['_id'] | IRole['name'],
		options: WithoutProjection<FindOneOptions<IRole>>,
	): Promise<IRole | null>;

	async findOneByIdOrName<P>(
		_idOrName: IRole['_id'] | IRole['name'],
		options: FindOneOptions<P extends IRole ? IRole : P>,
	): Promise<P | null>;

	findOneByIdOrName<P>(_idOrName: IRole['_id'] | IRole['name'], options?: any): Promise<IRole | P | null> {
		const query: FilterQuery<IRole> = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}

	async findOneByName<P = IRole>(name: IRole['name'], options?: any): Promise<IRole | P | null> {
		const query: FilterQuery<IRole> = {
			name,
		};

		return this.findOne(query, options);
	}

	findInIds<P>(ids: IRole['_id'][], options?: FindOneOptions<IRole>): P extends Pick<IRole, '_id'> ? Cursor<P> : Cursor<IRole> {
		const query: FilterQuery<IRole> = {
			name: {
				$in: ids,
			},
		};

		return this.find(query, options || {}) as P extends Pick<IRole, '_id'> ? Cursor<P> : Cursor<IRole>;
	}

	findAllExceptIds<P>(ids: IRole['_id'][], options?: FindOneOptions<IRole>): P extends Pick<IRole, '_id'> ? Cursor<P> : Cursor<IRole> {
		const query: FilterQuery<IRole> = {
			_id: {
				$nin: ids,
			},
		};

		return this.find(query, options || {}) as P extends Pick<IRole, '_id'> ? Cursor<P> : Cursor<IRole>;
	}

	updateById(
		_id: IRole['_id'],
		name: IRole['name'],
		scope: IRole['scope'],
		description: IRole['description'] = '',
		mandatory2fa: IRole['mandatory2fa'] = false,
	): Promise<UpdateWriteOpResult> {
		const queryData = {
			name,
			scope,
			description,
			mandatory2fa,
		};

		return this.updateOne({ _id }, { $set: queryData }, { upsert: true });
	}

	findUsersInRole(roleId: IRole['_id'], scope?: IRoom['_id']): Promise<Cursor<IUser>>;

	findUsersInRole(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options: WithoutProjection<FindOneOptions<IUser>>,
	): Promise<Cursor<IUser>>;

	findUsersInRole<P>(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options: FindOneOptions<P extends IUser ? IUser : P>,
	): Promise<Cursor<P extends IUser ? IUser : P>>;

	async findUsersInRole<P>(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options?: any | undefined,
	): Promise<Cursor<IUser> | Cursor<P>> {
		if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
			throw new Error('Roles.findUsersInRole method received a role scope instead of a scope value.');
		}

		const role = await this.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });

		if (!role) {
			throw new Error('RolesRaw.findUsersInRole: role not found');
		}

		switch (role.scope) {
			case 'Subscriptions':
				return this.models.Subscriptions.findUsersInRoles([role._id], scope, options);
			case 'Users':
			default:
				return this.models.Users.findUsersInRoles([role._id], null, options);
		}
	}

	createWithRandomId(
		name: IRole['name'],
		scope: IRole['scope'] = 'Users',
		description = '',
		protectedRole = true,
		mandatory2fa = false,
	): Promise<InsertOneWriteOpResult<WithId<IRole>>> {
		const role = {
			name,
			scope,
			description,
			protected: protectedRole,
			mandatory2fa,
		};

		return this.insertOne(role);
	}

	async canAddUserToRole(uid: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id']): Promise<boolean> {
		if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
			throw new Error('Roles.canAddUserToRole method received a role scope instead of a scope value.');
		}

		const role = await this.findOne({ _id: roleId }, { fields: { scope: 1 } } as FindOneOptions<IRole>);
		if (!role) {
			return false;
		}

		switch (role.scope) {
			case 'Subscriptions':
				return this.models.Subscriptions.isUserInRoleScope(uid, scope);
			case 'Users':
			default:
				return this.models.Users.isUserInRoleScope(uid);
		}
	}
}
