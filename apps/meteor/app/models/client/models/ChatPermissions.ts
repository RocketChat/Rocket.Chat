import type { IPermission } from '@rocket.chat/core-typings';

import { CachedCollection } from '../../../ui-cached-collection/client';

export const AuthzCachedCollection = new CachedCollection<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
});

export const ChatPermissions = AuthzCachedCollection.collection;
