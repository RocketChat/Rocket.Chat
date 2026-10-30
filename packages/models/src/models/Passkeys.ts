import type { IPasskey, IUser } from '@rocket.chat/core-typings';
import type { DocumentWithProjection, FindOptionsWithProjection, InsertionModel, IPasskeysModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Document, FindCursor, IndexDescription, MongoServerError, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

const DUPLICATE_KEY_ERROR_CODE = 11000;

export class PasskeysRaw extends BaseRaw<IPasskey> implements IPasskeysModel {
	constructor(db: Db) {
		super(db, 'passkeys');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { credentialId: 1 }, unique: true }, { key: { userId: 1 } }];
	}

	findOneByCredentialId<T extends Document = IPasskey, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		credentialId: IPasskey['credentialId'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ credentialId }, options);
	}

	findByUserId<T extends Document = IPasskey, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ userId }, options);
	}

	countByUserId(userId: IUser['_id']): Promise<number> {
		return this.countDocuments({ userId });
	}

	async insertUnlessCredentialExists(passkey: InsertionModel<IPasskey>): Promise<IPasskey['_id'] | null> {
		try {
			const { insertedId } = await this.insertOne(passkey);
			return insertedId;
		} catch (error: unknown) {
			if (typeof error === 'object' && error !== null && (error as MongoServerError).code === DUPLICATE_KEY_ERROR_CODE) {
				return null;
			}
			throw error;
		}
	}

	setCounterByIdAndCounter(
		_id: IPasskey['_id'],
		currentCounter: IPasskey['counter'],
		{ counter, backedUp }: Pick<IPasskey, 'counter' | 'backedUp'>,
	): Promise<UpdateResult> {
		return this.updateOne({ _id, counter: currentCounter }, { $set: { counter, backedUp } });
	}

	setLastUsedById(
		_id: IPasskey['_id'],
		{ lastUsedAt, lastUsedFrom }: Required<Pick<IPasskey, 'lastUsedAt'>> & Pick<IPasskey, 'lastUsedFrom'>,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: { lastUsedAt, ...(lastUsedFrom && { lastUsedFrom }) } });
	}

	setNameByIdAndUserId(_id: IPasskey['_id'], userId: IUser['_id'], name: IPasskey['name']): Promise<UpdateResult> {
		return this.updateOne({ _id, userId }, { $set: { name } });
	}

	removeByIdAndUserId(_id: IPasskey['_id'], userId: IUser['_id']): Promise<DeleteResult> {
		return this.deleteOne({ _id, userId });
	}

	removeByUserId(userId: IUser['_id']): Promise<DeleteResult> {
		return this.deleteMany({ userId });
	}
}
