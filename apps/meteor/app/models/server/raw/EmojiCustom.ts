import { Cursor, FindOneOptions, InsertOneWriteOpResult, UpdateWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import { IEmojiCustom as T } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class EmojiCustomRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { name: 1 } }, { key: { aliases: 1 } }, { key: { extension: 1 } }];
	}

	// find
	findByNameOrAlias(emojiName: string, options: WithoutProjection<FindOneOptions<T>>): Cursor<T> {
		let name = emojiName;

		if (typeof emojiName === 'string') {
			name = emojiName.replace(/:/g, '');
		}

		const query = {
			$or: [{ name }, { aliases: name }],
		};

		return this.find(query, options);
	}

	findByNameOrAliasExceptID(name: string, except: string, options: WithoutProjection<FindOneOptions<T>>): Cursor<T> {
		const query = {
			_id: { $nin: [except] },
			$or: [{ name }, { aliases: name }],
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

	setAliases(_id: string, aliases: string): Promise<UpdateWriteOpResult> {
		const update = {
			$set: {
				aliases,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setExtension(_id: string, extension: string): Promise<UpdateWriteOpResult> {
		const update = {
			$set: {
				extension,
			},
		};

		return this.updateOne({ _id }, update);
	}

	// INSERT
	create(data: T): Promise<InsertOneWriteOpResult<WithId<T>>> {
		return this.insertOne(data);
	}
}
