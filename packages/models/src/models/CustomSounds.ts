import type { ICustomSound, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICustomSoundsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, FindOptions, IndexDescription, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CustomSoundsRaw extends BaseRaw<ICustomSound> implements ICustomSoundsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICustomSound>>) {
		super(db, 'custom_sounds', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 } }];
	}

	// find
	findByName(name: string, options?: FindOptions<ICustomSound>): FindCursor<ICustomSound> {
		const query = {
			name,
		};

		return this.find(query, options);
	}

	findByNameExceptId(name: string, except: string, options?: FindOptions<ICustomSound>): FindCursor<ICustomSound> {
		const query = {
			_id: { $nin: [except] },
			name,
		};

		return this.find(query, options);
	}

	// update
	setName(_id: string, name: string): Promise<UpdateResult> {
		const update = {
			$set: {
				name,
			},
		};

		return this.updateOne({ _id }, update);
	}

	// INSERT
	create(data: Omit<ICustomSound, '_id'>): Promise<InsertOneResult<WithId<ICustomSound>>> {
		return this.insertOne(data);
	}
}
