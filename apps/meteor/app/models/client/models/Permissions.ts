import type { IPermission } from '@rocket.chat/core-typings';

import { CachedCollection } from '../../../../client/lib/cachedCollections';

export const AuthzCachedCollection = new CachedCollection<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
});

export const Permissions = AuthzCachedCollection.collection;
