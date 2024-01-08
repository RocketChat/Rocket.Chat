import type { IPermission } from '@rocket.chat/core-typings';

import { CachedCollection } from '../../../ui-cached-collection/client';

export const AuthzCachedCollection = new CachedCollection<IPermission>({
	name: 'permissions',
	eventType: 'onLogged',
});

export const ChatPermissions = AuthzCachedCollection.collection;
