import type { DeleteWriteOpResultObject, IndexSpecification } from 'mongodb';
import type { IOEmbedCache } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class OEmbedCache extends ModelClass<IOEmbedCache> {
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
