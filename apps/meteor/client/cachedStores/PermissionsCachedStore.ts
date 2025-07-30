import type { IPermission } from '@rocket.chat/core-typings';

import { createDocumentMapStore } from '../lib/cachedCollections';
import { PrivateCachedStore } from '../lib/cachedCollections/CachedCollection';

export const PermissionsCachedStore = new PrivateCachedStore<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
	store: createDocumentMapStore(),
});
