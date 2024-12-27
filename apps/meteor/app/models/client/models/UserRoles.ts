import type { IRocketChatRecord, IRole } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const UserRoles = new Mongo.Collection<
	IRocketChatRecord & {
		roles?: IRole['_id'][];
	}
>(null);
