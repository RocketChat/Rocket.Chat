import type { IUser } from '@rocket.chat/core-typings';

import { MinimongoCollection } from '../../../../client/lib/cachedCollections/MinimongoCollection';

class UsersCollection extends MinimongoCollection<IUser> {}

const collection = new UsersCollection();

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Users = {
	use: collection.use,
	get state() {
		return this.use.getState();
	},
	collection,
};
