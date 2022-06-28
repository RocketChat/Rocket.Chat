/**
 * Modals model
 */
import type { FindOneOptions, Cursor, UpdateWriteOpResult } from 'mongodb';
import type { IModal, IUser } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class ModalsRaw extends BaseRaw<IModal> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { createdBy: -1 } }, { key: { active: 1 } }, { key: { createdBy: 1, createdAt: -1, active: 1 }, background: true }];
	}

	findOneByIdAndUserId(_id: IModal['_id'], userId: IUser['_id'], options: FindOneOptions<IModal>): Promise<IModal | null> {
		return this.findOne({ _id, createBy: userId }, options);
	}

	findWithUserId(userId: IUser['_id'], options: FindOneOptions<IModal>): Cursor<IModal> {
		const query = { createdBy: userId, active: { $ne: false, $exists: true } };
		return this.find(query, options);
	}

	findByCreatedBy(createdBy: IUser['_id'], options: FindOneOptions<IModal>): Cursor<IModal> {
		const query = { createdBy };
		return this.find(query, options);
	}

	async deleteModal(_id: IModal['_id']): Promise<Pick<UpdateWriteOpResult, 'modifiedCount' | 'matchedCount'>> {
		return this.updateOne({ _id }, { $set: { active: false } });
	}
}
