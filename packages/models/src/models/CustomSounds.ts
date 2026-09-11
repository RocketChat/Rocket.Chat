import type { ICustomSound, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICustomSoundsModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription, InsertOneResult, UpdateResult, WithId, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CustomSoundsRaw extends BaseRaw<ICustomSound> implements ICustomSoundsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICustomSound>>) {
		super(db, 'custom_sounds', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 } }];
	}

	// find
	findByName<T extends Document = ICustomSound, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		exceptId?: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			name,
			...(exceptId && { _id: { $nin: [exceptId] } }),
		};

		return this.find<T, O>(query, options);
	}

	findOneByName<T extends Document = ICustomSound, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		exceptId?: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		const query = {
			name,
			...(exceptId && { _id: { $nin: [exceptId] } }),
		};

		return this.findOne<T, O>(query, options);
	}

	// INSERT
	create(data: Omit<ICustomSound, '_id' | '_updatedAt'>): Promise<InsertOneResult<WithId<ICustomSound>>> {
		return this.insertOne(data);
	}

	updateById(_id: string, data: Partial<Omit<ICustomSound, '_id'>>): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: data });
	}
}
