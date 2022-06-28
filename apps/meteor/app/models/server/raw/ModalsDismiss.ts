/**
 * Modals model
 */
import type { FindOneOptions, Cursor, DeleteWriteOpResultObject } from 'mongodb';
import type { IModal, IModalDismiss, IUser } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class ModalsDismissRaw extends BaseRaw<IModalDismiss> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { createdAt: -1 } }, { key: { _modal: 1, _user: 1, createdAt: -1 }, background: true }];
	}

	findOneByModalIdAndUserId(
		modalId: IModal['_id'],
		userId: IUser['_id'],
		options: FindOneOptions<IModalDismiss>,
	): Promise<IModalDismiss | null> {
		return this.findOne({ _modal: modalId, _user: userId }, options);
	}

	findWithUserId(userId: IUser['_id'], options: FindOneOptions<IModalDismiss>): Cursor<IModalDismiss> {
		const query = { _user: userId };
		return this.find(query, options);
	}

	async removeUserByUserIdAndId(modalId: IModal['_id'], userId: IUser['_id']): Promise<Pick<DeleteWriteOpResultObject, 'deletedCount'>> {
		return this.deleteOne({ _modal: modalId, _user: userId });
	}
}
