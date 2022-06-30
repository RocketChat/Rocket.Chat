/**
 * Modals model
 */
import type { Collection, Db, Cursor, DeleteWriteOpResultObject, FindOneOptions, IndexSpecification } from 'mongodb';
import type { IModal, IModalDismiss, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IModalDismissModel } from '@rocket.chat/model-typings';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class ModalDismissRaw extends BaseRaw<IModalDismiss> implements IModalDismissModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IModalDismiss>>) {
		super(db, getCollectionName('modals_dismiss'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { createdAt: -1 } }, { key: { modalId: 1, userId: 1, createdAt: -1 }, background: true }];
	}

	findOneByModalIdAndUserId(
		modalId: IModal['_id'],
		userId: IUser['_id'],
		options: FindOneOptions<IModalDismiss>,
	): Promise<IModalDismiss | null> {
		return this.findOne({ modalId, userId }, options);
	}

	findWithUserId(userId: IUser['_id'], options: FindOneOptions<IModalDismiss>): Cursor<IModalDismiss> {
		const query = { userId };
		return this.find(query, options);
	}

	async removeUserByUserIdAndId(modalId: IModal['_id'], userId: IUser['_id']): Promise<Pick<DeleteWriteOpResultObject, 'deletedCount'>> {
		return this.deleteOne({ modalId, userId });
	}
}
