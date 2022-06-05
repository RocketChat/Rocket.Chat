import { IndexSpecification } from 'mongodb';
import type { Cursor, FindOneOptions, InsertOneWriteOpResult, UpdateWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import { ICustomSound } from '@rocket.chat/core-typings';
import type { ICustomSoundsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class CustomSounds extends ModelClass<ICustomSound> implements ICustomSoundsModel {
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

const col = db.collection(`${prefix}custom_sounds`);
registerModel('ICustomSoundsModel', new CustomSounds(col, trashCollection) as ICustomSoundsModel);
