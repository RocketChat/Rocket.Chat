import type { IPermission } from '@rocket.chat/core-typings';

import { PrivateCachedCollection } from '../../../../client/lib/cachedCollections';

export const AuthzCachedCollection = new PrivateCachedCollection<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
});

export const Permissions = AuthzCachedCollection.collection;
