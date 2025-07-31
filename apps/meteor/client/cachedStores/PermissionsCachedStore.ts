import type { IPermission } from '@rocket.chat/core-typings';

import { createDocumentMapStore, PrivateCachedStore } from '../lib/cachedStores';

export const PermissionsCachedStore = new PrivateCachedStore<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
	store: createDocumentMapStore(),
});
