import type { IRole } from '@rocket.chat/core-typings';

import { createDocumentMapStore, createGlobalStore } from '../lib/cachedStores';

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Roles = createGlobalStore(createDocumentMapStore<IRole>());
