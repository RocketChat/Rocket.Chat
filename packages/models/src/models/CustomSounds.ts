import type { ICustomSound, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICustomSoundsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, FindOptions, IndexDescription, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CustomSoundsRaw extends BaseRaw<ICustomSound> implements ICustomSoundsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICustomSound>>) {
		super(db, 'custom_sounds', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 } }];
	}

	// find
	findByName(name: string, exceptId?: string, options?: FindOptions<ICustomSound>): FindCursor<ICustomSound> {
		const query = {
			name,
			...(exceptId && { _id: { $nin: [exceptId] } }),
		};

		return this.find(query, options);
	}

	// INSERT
	create(data: Omit<ICustomSound, '_id'>): Promise<InsertOneResult<WithId<ICustomSound>>> {
		return this.insertOne(data);
	}

	updateById(_id: string, data: Partial<Omit<ICustomSound, '_id'>>): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: data });
	}
}
