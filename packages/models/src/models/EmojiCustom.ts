import type { IEmojiCustom, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IEmojiCustomModel, InsertionModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, FindOptions, IndexDescription, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class EmojiCustomRaw extends BaseRaw<IEmojiCustom> implements IEmojiCustomModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IEmojiCustom>>) {
		super(db, 'custom_emoji', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 } }, { key: { aliases: 1 } }, { key: { extension: 1 } }];
	}

	// find
	findByNameOrAlias(emojiName: string, options?: FindOptions<IEmojiCustom>): FindCursor<IEmojiCustom> {
		let name = emojiName;

		if (typeof emojiName === 'string') {
			name = emojiName.replace(/:/g, '');
		}

		const query = {
			$or: [{ name }, { aliases: name }],
		};

		return this.find(query, options);
	}

	findByNameOrAliasExceptID(name: string, except: string, options?: FindOptions<IEmojiCustom>): FindCursor<IEmojiCustom> {
		const query = {
			_id: { $nin: [except] },
			$or: [{ name }, { aliases: name }],
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

	setAliases(_id: string, aliases: string[]): Promise<UpdateResult> {
		const update = {
			$set: {
				aliases,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setExtension(_id: string, extension: string): Promise<UpdateResult> {
		const update = {
			$set: {
				extension,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setETagByName(name: string, etag: string): Promise<UpdateResult> {
		const update = {
			$set: {
				etag,
			},
		};

		return this.updateOne({ name }, update);
	}

	// INSERT
	create(data: InsertionModel<IEmojiCustom>): Promise<InsertOneResult<WithId<IEmojiCustom>>> {
		return this.insertOne(data);
	}

	countByNameOrAlias(name: string): Promise<number> {
		const query = {
			$or: [{ name }, { aliases: name }],
		};

		return this.countDocuments(query);
	}
}
