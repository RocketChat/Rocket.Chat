import type { IRocketChatRecord, IRole } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

/** @deprecated */
export const UserRoles = new Mongo.Collection<
	IRocketChatRecord & {
		roles?: IRole['_id'][];
	}
>(null);
