/**
 * Modals model
 */
import type { FindOneOptions, Cursor, UpdateWriteOpResult } from 'mongodb';
import type { IModal, IUser } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

type T = IModal;

export class ModalsRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { createdBy: 1 } }, { key: { 'users.userId': 1, 'createdAt': 1 }, background: true }];
	}

	findOneByIdAndUserId(_id: IModal['_id'], userId: IUser['_id'], options: FindOneOptions<T>): Promise<T | null> {
		return this.findOne({ _id, users: { $elemMatch: { userId } } }, options);
	}

	findWithUserId(userId: IUser['_id'], options: FindOneOptions<T>): Cursor<T> {
		const query = { users: { $elemMatch: { userId } } };
		return this.find(query, options);
	}

	findByCreatedBy(createdBy: IUser['_id'], options: FindOneOptions<T>): Cursor<T> {
		const query = { createdBy };
		return this.find(query, options);
	}

	async addUserByIdAndUserId(
		_id: IModal['_id'],
		userId: IUser['_id'],
	): Promise<Pick<UpdateWriteOpResult, 'modifiedCount' | 'matchedCount'>> {
		// check if exists
		const query = { _id, users: { $elemMatch: { userId } } };
		const exists = await this.findOne<IModal>(query, {
			projection: { _id: 1 },
		});
		if (exists) return { matchedCount: 0, modifiedCount: 0 };

		const date = new Date();
		return this.updateOne(
			{ _id },
			{
				$push: {
					users: {
						userId,
						createdAt: date,
					},
				},
			},
		);
	}

	async removeUserByUserIdAndId(
		_id: IModal['_id'],
		userId: IUser['_id'],
	): Promise<Pick<UpdateWriteOpResult, 'modifiedCount' | 'matchedCount'>> {
		return this.updateOne({ _id, users: { $elemMatch: { userId } } }, { $pull: { users: { userId } } });
	}
}
