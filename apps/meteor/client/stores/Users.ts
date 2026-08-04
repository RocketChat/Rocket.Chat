import type { IUser } from '@rocket.chat/core-typings';

import type { IDocumentMapStoreHooks } from '../lib/cachedStores/DocumentMapStore';
import { createDocumentMapStore } from '../lib/cachedStores/DocumentMapStore';
import { createGlobalStore } from '../lib/cachedStores/createGlobalStore';

const hooks: IDocumentMapStoreHooks<IUser> = {};

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Users = createGlobalStore(createDocumentMapStore<IUser>(hooks), {
	hooks,
});
