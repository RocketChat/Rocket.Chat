import { IndexSpecification } from 'mongodb';
import type { Cursor, FindOneOptions, InsertOneWriteOpResult, UpdateWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import { ICustomSound } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class CustomSounds extends ModelClass<ICustomSound> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { name: 1 } }];
	}

	// find
	findByName(name: string, options: WithoutProjection<FindOneOptions<ICustomSound>>): Cursor<ICustomSound> {
		const query = {
			name,
		};

		return this.find(query, options);
	}

	findByNameExceptId(name: string, except: string, options: WithoutProjection<FindOneOptions<ICustomSound>>): Cursor<ICustomSound> {
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
	create(data: ICustomSound): Promise<InsertOneWriteOpResult<WithId<ICustomSound>>> {
		return this.insertOne(data);
	}
}
