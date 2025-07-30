import type { IPermission } from '@rocket.chat/core-typings';

import { PrivateCachedStore } from '../../../../client/lib/cachedCollections/CachedCollection';
import { createDocumentMapStore } from '../../../../client/lib/cachedCollections/DocumentMapStore';

export const AuthzCachedCollection = new PrivateCachedStore<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
	store: createDocumentMapStore(),
});
