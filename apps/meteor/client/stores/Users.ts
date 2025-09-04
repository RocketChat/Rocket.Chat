import type { IUser } from '@rocket.chat/core-typings';

import { createGlobalStore, MinimongoCollection } from '../lib/cachedStores';

class UsersCollection extends MinimongoCollection<IUser> {}

const collection = new UsersCollection();

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Users = createGlobalStore(collection.use, {
	collection,
});
