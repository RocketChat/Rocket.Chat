import type { IEmojiCustom, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IEmojiCustomModel } from '@rocket.chat/model-typings';
import type {
	Collection,
	Cursor,
	Db,
	FindOneOptions,
	IndexSpecification,
	InsertOneWriteOpResult,
	UpdateWriteOpResult,
	WithId,
	WithoutProjection,
} from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class EmojiCustomRaw extends BaseRaw<IEmojiCustom> implements IEmojiCustomModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IEmojiCustom>>) {
		super(db, getCollectionName('custom_emoji'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { name: 1 } }, { key: { aliases: 1 } }, { key: { extension: 1 } }];
	}

	// find
	findByNameOrAlias(emojiName: string, options: WithoutProjection<FindOneOptions<IEmojiCustom>>): Cursor<IEmojiCustom> {
		let name = emojiName;

		if (typeof emojiName === 'string') {
			name = emojiName.replace(/:/g, '');
		}

		const query = {
			$or: [{ name }, { aliases: name }],
		};

		return this.find(query, options);
	}

	findByNameOrAliasExceptID(name: string, except: string, options: WithoutProjection<FindOneOptions<IEmojiCustom>>): Cursor<IEmojiCustom> {
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

	setAliases(_id: string, aliases: string[]): Promise<UpdateWriteOpResult> {
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
	create(data: IEmojiCustom): Promise<InsertOneWriteOpResult<WithId<IEmojiCustom>>> {
		return this.insertOne(data);
	}
}
