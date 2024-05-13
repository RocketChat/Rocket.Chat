import type { IPermission, IRole, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IPermissionsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, FindCursor, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class PermissionsRaw extends BaseRaw<IPermission> implements IPermissionsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IPermission>>) {
		super(db, 'permissions', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					level: 1,
					settingId: 1,
				},
			},
		];
	}

	async createOrUpdate(name: string, roles: IRole['_id'][]): Promise<IPermission['_id']> {
		const exists = await this.findOne<Pick<IPermission, '_id'>>(
			{
				_id: name,
				roles,
			},
			{ projection: { _id: 1 } },
		);

		if (exists) {
			return exists._id;
		}

		await this.updateOne({ _id: name }, { $set: { roles } }, { upsert: true });

		return name;
	}

	async create(id: string, roles: IRole['_id'][]): Promise<IPermission['_id']> {
		const exists = await super.findOneById(id, { projection: { _id: 1 } });
		if (exists) {
			return exists._id;
		}

		await this.updateOne({ _id: id }, { $set: { roles } }, { upsert: true });

		return id;
	}

	async addRole(permission: string, role: IRole['_id']): Promise<void> {
		await this.updateOne({ _id: permission, roles: { $ne: role } }, { $addToSet: { roles: role } });
	}

	async setRoles(permission: string, roles: IRole['_id'][]): Promise<void> {
		await this.updateOne({ _id: permission }, { $set: { roles } });
	}

	async removeRole(permission: string, role: IRole['_id']): Promise<void> {
		await this.updateOne({ _id: permission, roles: role }, { $pull: { roles: role } });
	}

	async findOneById(_id: IPermission['_id'], options?: FindOptions<IPermission>): Promise<IPermission | null> {
		return super.findOneById(_id, options);
	}

	findByLevel(level: 'settings', settingId?: string): FindCursor<IPermission> {
		return this.find({ level, ...(settingId && { settingId }) });
	}

	findOneByGroupPermissionId(groupPermissionId: IPermission['groupPermissionId']): Promise<IPermission | null> {
		return this.findOne({ groupPermissionId });
	}
}
