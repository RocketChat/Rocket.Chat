import { Mongo } from 'meteor/mongo';
import type { Collection } from 'mongodb';

import { SystemLogger } from '../lib/logger/system';

// TODO need to improve how other files imports this
export const trash = new Mongo.Collection('rocketchat__trash');
try {
	trash._ensureIndex({ __collection__: 1 });
	trash._ensureIndex({ _deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

	trash._ensureIndex({ rid: 1, __collection__: 1, _deletedAt: 1 });
} catch (e) {
	SystemLogger.error(e);
}

export const trashCollection = trash.rawCollection() as Collection<any>;
