import { ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class EmailInboxRaw extends BaseRaw {
	async insertOne(data) {
		return this.col.insertOne({
			_id: new ObjectId().toHexString(),
			...data,
		});
	}
}
