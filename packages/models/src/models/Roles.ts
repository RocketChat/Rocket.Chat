import type { IRole, IRoom, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IRolesModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, Filter, FindOptions, Document, CountDocumentsOptions } from 'mongodb';

import { Subscriptions, Users } from '../index';
import { BaseRaw } from './BaseRaw';

export class RolesRaw extends BaseRaw<IRole> implements IRolesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IRole>>) {
		super(db, 'roles', trash);
	}

	findByUpdatedDate<T extends Document = IRole, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		updatedAfterDate: Date,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			_updatedAt: { $gte: new Date(updatedAfterDate) },
		};

		return options ? this.find<T, O>(query, options) : this.find<T, O>(query);
	}

	async isUserInRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean> {
		if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
			throw new Error('Roles.isUserInRoles method received a role scope instead of a scope value.');
		}

		for (const roleId of roles) {
			const role = await this.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });

			if (!role) {
				continue;
			}

			switch (role.scope) {
				case 'Subscriptions':
					if (await Subscriptions.isUserInRole(userId, roleId, scope)) {
						return true;
					}
					break;
				case 'Users':
				default:
					if (await Users.isUserInRole(userId, roleId)) {
						return true;
					}
			}
		}
		return false;
	}

	findOneByIdOrName<P extends Document = IRole, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		_idOrName: IRole['_id'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		const query: Filter<IRole> = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne<P, O>(query, options);
	}

	async findOneByName<P = IRole>(name: IRole['name'], options?: any): Promise<IRole | P | null> {
		const query: Filter<IRole> = {
			name,
		};

		return this.findOne<IRole>(query, options);
	}

	findInIds<P>(ids: IRole['_id'][], options?: FindOptions<IRole>): P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole> {
		const query: Filter<IRole> = {
			_id: {
				$in: ids,
			},
		};

		return this.find(query, options || {}) as P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole>;
	}

	findInIdsOrNames<P>(
		_idsOrNames: IRole['_id'][],
		options?: FindOptions<IRole>,
	): P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole> {
		const query: Filter<IRole> = {
			$or: [
				{
					_id: {
						$in: _idsOrNames,
					},
				},
				{
					name: {
						$in: _idsOrNames,
					},
				},
			],
		};

		return this.find(query, options || {}) as P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole>;
	}

	findByScope<T extends Document = IRole, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		scope: IRole['scope'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			scope,
		};

		return this.find<T, O>(query, options);
	}

	countByScope(scope: IRole['scope'], options?: CountDocumentsOptions): Promise<number> {
		const query = {
			scope,
		};

		return this.countDocuments(query, options);
	}

	findCustomRoles<T extends Document = IRole, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query: Filter<IRole> = {
			protected: false,
		};

		return this.find<T, O>(query, options);
	}

	countCustomRoles(options?: CountDocumentsOptions): Promise<number> {
		const query: Filter<IRole> = {
			protected: false,
		};

		return this.countDocuments(query, options || {});
	}

	async updateById(
		_id: IRole['_id'],
		name: IRole['name'],
		scope: IRole['scope'],
		description: IRole['description'] = '',
		mandatory2fa: IRole['mandatory2fa'] = false,
	): Promise<IRole> {
		const response = await this.findOneAndUpdate(
			{ _id },
			{
				$set: {
					name,
					scope,
					description,
					mandatory2fa,
				},
			},
			{ upsert: true, returnDocument: 'after' },
		);

		if (!response) {
			console.log('Role not found', _id, name);
			throw new Error('Role not found');
		}

		return response;
	}

	findUsersInRole(roleId: IRole['_id'], scope?: IRoom['_id']): Promise<FindCursor<IUser>>;

	findUsersInRole(roleId: IRole['_id'], scope: IRoom['_id'] | undefined, options: FindOptions<IUser>): Promise<FindCursor<IUser>>;

	findUsersInRole<P extends Document>(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options: FindOptions<P extends IUser ? IUser : P>,
	): Promise<FindCursor<P extends IUser ? IUser : P>>;

	/** @deprecated function getUsersInRole should be used instead */
	async findUsersInRole<P extends Document>(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options?: any,
	): Promise<FindCursor<IUser | P>> {
		if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
			throw new Error('Roles.findUsersInRole method received a role scope instead of a scope value.');
		}

		const role = await this.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });

		if (!role) {
			throw new Error('RolesRaw.findUsersInRole: role not found');
		}

		switch (role.scope) {
			case 'Subscriptions':
				return Subscriptions.findUsersInRoles([role._id], scope, options);
			case 'Users':
			default:
				return Users.findUsersInRoles<IUser | P>([role._id], null, options);
		}
	}

	async countUsersInRole(roleId: IRole['_id'], scope?: IRoom['_id']): Promise<number> {
		const role = await this.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });

		if (!role) {
			throw new Error('RolesRaw.countUsersInRole: role not found');
		}

		switch (role.scope) {
			case 'Subscriptions':
				return Subscriptions.countUsersInRoles([role._id], scope);
			case 'Users':
			default:
				return Users.countUsersInRoles([role._id]);
		}
	}

	async createWithRandomId(
		name: IRole['name'],
		scope: IRole['scope'] = 'Users',
		description = '',
		protectedRole = true,
		mandatory2fa = false,
	): Promise<IRole> {
		const role = {
			name,
			scope,
			description,
			protected: protectedRole,
			mandatory2fa,
		};

		const res = await this.insertOne(role);

		return {
			_id: res.insertedId,
			_updatedAt: new Date(), // TODO: this should be set by the BaseRaw, but we need to set it here to return a complete IRole object
			...role,
		};
	}

	async canAddUserToRole(uid: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id']): Promise<boolean> {
		if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
			throw new Error('Roles.canAddUserToRole method received a role scope instead of a scope value.');
		}

		const role = await this.findOne({ _id: roleId }, { projection: { scope: 1 } });
		if (!role) {
			return false;
		}

		switch (role.scope) {
			case 'Subscriptions':
				return Subscriptions.isUserInRoleScope(uid, scope);
			case 'Users':
			default:
				return Users.isUserInRoleScope(uid);
		}
	}
}
