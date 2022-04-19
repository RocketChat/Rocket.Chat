import { Cursor, FindOneOptions, InsertOneWriteOpResult, UpdateWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import { ICustomSound as T } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class CustomSoundsRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { name: 1 } }];
	}

	// find
	findByName(name: string, options: WithoutProjection<FindOneOptions<T>>): Cursor<T> {
		const query = {
			name,
		};

		return this.find(query, options);
	}

	findByNameExceptId(name: string, except: string, options: WithoutProjection<FindOneOptions<T>>): Cursor<T> {
		const query = {
			_id: { $nin: [except] },
			name,
		};

		return this.find(query, options);
	}

	// update
	setName(_id: string, name: string): Promise<UpdateWriteOpResult> {
		const update = {
			$set: {
				name,
			},
		};

		return this.updateOne({ _id }, update);
	}

	// INSERT
	create(data: T): Promise<InsertOneWriteOpResult<WithId<T>>> {
		return this.insertOne(data);
	}
}
