import type { IPermission } from '@rocket.chat/core-typings';

import { createDocumentMapStore } from '../../../../client/lib/cachedCollections';
import { PrivateCachedStore } from '../../../../client/lib/cachedCollections/CachedCollection';

export const AuthzCachedCollection = new PrivateCachedStore<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
	store: createDocumentMapStore(),
});
