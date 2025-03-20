import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class TrashRaw extends BaseRaw<RocketChatRecordDeleted<any>> {
	constructor(db: Db) {
		super(db, 'rocketchat__trash', undefined, {
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	protected modelIndexes(): IndexDescription[] | undefined {
		return [
			{ key: { __collection__: 1 } },
			{ key: { _deletedAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 },
			{ key: { rid: 1, __collection__: 1, _deletedAt: 1 } },
		];
	}
}
