import type { IOEmbedCache, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOEmbedCacheModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteWriteOpResultObject, IndexSpecification } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class OEmbedCacheRaw extends BaseRaw<IOEmbedCache> implements IOEmbedCacheModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOEmbedCache>>) {
		super(db, getCollectionName('oembed_cache'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { updatedAt: 1 } }];
	}

	async createWithIdAndData(_id: string, data: any): Promise<IOEmbedCache> {
		const record = {
			_id,
			data,
			updatedAt: new Date(),
		};
		record._id = (await this.insertOne(record)).insertedId;
		return record;
	}

	removeAfterDate(date: Date): Promise<DeleteWriteOpResultObject> {
		const query = {
			updatedAt: {
				$lte: date,
			},
		};
		return this.deleteMany(query);
	}
}
