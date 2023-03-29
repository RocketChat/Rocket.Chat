import { Mongo } from 'meteor/mongo';
import type { IRocketChatRecord, IRole } from '@rocket.chat/core-typings';

/** @deprecated */
export const UserRoles = new Mongo.Collection<
	IRocketChatRecord & {
		roles?: IRole['_id'][];
	}
>(null);
