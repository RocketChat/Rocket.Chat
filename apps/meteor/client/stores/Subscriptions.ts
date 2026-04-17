import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { createDocumentMapStore } from '../lib/cachedStores/DocumentMapStore';
import { createGlobalStore } from '../lib/cachedStores/createGlobalStore';

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Subscriptions = createGlobalStore(createDocumentMapStore<SubscriptionWithRoom>());
