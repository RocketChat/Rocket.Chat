import { Mongo } from 'meteor/mongo';
import type { Collection } from 'mongodb';
// import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';

import { SystemLogger } from '../lib/logger/system';
import { prefix } from './utils';

export const trash = new Mongo.Collection(`${prefix}_trash`);
try {
	trash._ensureIndex({ __collection__: 1 });
	trash._ensureIndex({ _deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

	trash._ensureIndex({ rid: 1, __collection__: 1, _deletedAt: 1 });
} catch (e) {
	SystemLogger.error(e);
}

export const trashCollection = trash.rawCollection() as Collection<any>;
