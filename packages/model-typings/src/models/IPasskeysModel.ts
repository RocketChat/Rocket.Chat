import type { IPasskey, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, Document, FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IPasskeysModel extends IBaseModel<IPasskey> {
	findOneByCredentialId<T extends Document = IPasskey, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		credentialId: IPasskey['credentialId'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findByUserId<T extends Document = IPasskey, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	countByUserId(userId: IUser['_id']): Promise<number>;

	/** Resolves the new passkey's id, or `null` when its credential is already registered to any user. */
	insertUnlessCredentialExists(passkey: InsertionModel<IPasskey>): Promise<IPasskey['_id'] | null>;

	/** Matches only while the stored counter is still `currentCounter`, so two uses that advance it from the same value cannot both succeed. */
	setCounterByIdAndCounter(
		_id: IPasskey['_id'],
		currentCounter: IPasskey['counter'],
		update: Pick<IPasskey, 'counter' | 'backedUp'>,
	): Promise<UpdateResult>;

	setLastUsedById(
		_id: IPasskey['_id'],
		lastUsed: Required<Pick<IPasskey, 'lastUsedAt'>> & Pick<IPasskey, 'lastUsedFrom'>,
	): Promise<UpdateResult>;

	setNameByIdAndUserId(_id: IPasskey['_id'], userId: IUser['_id'], name: IPasskey['name']): Promise<UpdateResult>;

	removeByIdAndUserId(_id: IPasskey['_id'], userId: IUser['_id']): Promise<DeleteResult>;

	removeByUserId(userId: IUser['_id']): Promise<DeleteResult>;
}
