import { DeleteWriteOpResultObject } from 'mongodb';

import { BaseRaw, IndexSpecification } from './BaseRaw';
import type { IOEmbedCache } from '@rocket.chat/core-typings';

type T = IOEmbedCache;

export class OEmbedCacheRaw extends BaseRaw<T> {
	protected indexes: IndexSpecification[] = [{ key: { updatedAt: 1 } }];

	async createWithIdAndData(_id: string, data: any): Promise<T> {
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
