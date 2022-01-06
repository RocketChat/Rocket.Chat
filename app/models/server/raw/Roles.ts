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

import { IRole, IUser } from '../../../../definition/IUser';
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

	createOrUpdate(
		name: IRole['name'],
		scope: 'Users' | 'Subscriptions' = 'Users',
		description = '',
		protectedRole = true,
		mandatory2fa = false,
	): Promise<UpdateWriteOpResult> {
		const queryData = {
			name,
			scope,
			description,
			protected: protectedRole,
			mandatory2fa,
		};

		return this.updateOne({ _id: name }, { $set: queryData }, { upsert: true });
	}

	async addUserRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: string): Promise<boolean> {
		if (!Array.isArray(roles)) {
			roles = [roles];
			process.env.NODE_ENV === 'development' && console.warn('[WARN] RolesRaw.addUserRoles: roles should be an array');
		}

		for await (const name of roles) {
			const role = await this.findOne({ name }, { scope: 1 } as FindOneOptions<IRole>);

			if (!role) {
				process.env.NODE_ENV === 'development' && console.warn(`[WARN] RolesRaw.addUserRoles: role: ${name} not found`);
				continue;
			}
			switch (role.scope) {
				case 'Subscriptions':
					await this.models.Subscriptions.addRolesByUserId(userId, [name], scope);
					break;
				case 'Users':
				default:
					await this.models.Users.addRolesByUserId(userId, [name]);
			}
		}
		return true;
	}

	async isUserInRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: string): Promise<boolean> {
		if (!Array.isArray(roles)) {
			// TODO: remove this check
			roles = [roles];
			process.env.NODE_ENV === 'development' && console.warn('[WARN] RolesRaw.isUserInRoles: roles should be an array');
		}

		for await (const roleName of roles) {
			const role = await this.findOne({ name: roleName }, { scope: 1 } as FindOneOptions<IRole>);

			if (!role) {
				continue;
			}

			switch (role.scope) {
				case 'Subscriptions':
					if (await this.models.Subscriptions.isUserInRole(userId, roleName, scope)) {
						return true;
					}
					break;
				case 'Users':
				default:
					if (await this.models.Users.isUserInRole(userId, roleName)) {
						return true;
					}
			}
		}
		return false;
	}

	async removeUserRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: string): Promise<boolean> {
		if (!Array.isArray(roles)) {
			// TODO: remove this check
			roles = [roles];
			process.env.NODE_ENV === 'development' && console.warn('[WARN] RolesRaw.removeUserRoles: roles should be an array');
		}
		for await (const roleName of roles) {
			const role = await this.findOne({ name: roleName }, { scope: 1 } as FindOneOptions<IRole>);

			if (!role) {
				continue;
			}

			switch (role.scope) {
				case 'Subscriptions':
					scope && (await this.models.Subscriptions.removeRolesByUserId(userId, [roleName], scope));
					break;
				case 'Users':
				default:
					await this.models.Users.removeRolesByUserId(userId, [roleName]);
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

	findUsersInRole(name: IRole['name'], scope?: string): Promise<Cursor<IUser>>;

	findUsersInRole(
		name: IRole['name'],
		scope: string | undefined,
		options: WithoutProjection<FindOneOptions<IUser>>,
	): Promise<Cursor<IUser>>;

	findUsersInRole<P>(
		name: IRole['name'],
		scope: string | undefined,
		options: FindOneOptions<P extends IUser ? IUser : P>,
	): Promise<Cursor<P extends IUser ? IUser : P>>;

	async findUsersInRole<P>(name: IRole['name'], scope: string | undefined, options?: any | undefined): Promise<Cursor<IUser> | Cursor<P>> {
		const role = await this.findOne({ name }, { scope: 1 } as FindOneOptions<IRole>);

		if (!role) {
			throw new Error('RolesRaw.findUsersInRole: role not found');
		}

		switch (role.scope) {
			case 'Subscriptions':
				return this.models.Subscriptions.findUsersInRoles([name], scope, options);
			case 'Users':
			default:
				return this.models.Users.findUsersInRoles([name], options);
		}
	}

	createWithRandomId(
		name: IRole['name'],
		scope: 'Users' | 'Subscriptions' = 'Users',
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

	async canAddUserToRole(uid: IUser['_id'], name: IRole['name'], scope?: string): Promise<boolean> {
		const role = await this.findOne({ name }, { fields: { scope: 1 } } as FindOneOptions<IRole>);
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
