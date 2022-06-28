import type { Cursor, DeleteWriteOpResultObject, FindOneOptions } from 'mongodb';
import type { IModal, IUser, IModalDismiss } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IModalDismissModel extends IBaseModel<IModalDismiss> {
	findOneByModalIdAndUserId(
		modalId: IModal['_id'],
		userId: IUser['_id'],
		options: FindOneOptions<IModalDismiss>,
	): Promise<IModalDismiss | null>;

	findWithUserId(userId: IUser['_id'], options: FindOneOptions<IModalDismiss>): Cursor<IModalDismiss>;

	removeUserByUserIdAndId(modalId: IModal['_id'], userId: IUser['_id']): Promise<Pick<DeleteWriteOpResultObject, 'deletedCount'>>;
}
