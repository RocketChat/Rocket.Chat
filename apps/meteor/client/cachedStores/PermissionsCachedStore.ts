import type { IPermission } from '@rocket.chat/core-typings';

import { PrivateCachedStore } from '../lib/cachedStores';
import { Permissions } from '../stores';

export const PermissionsCachedStore = new PrivateCachedStore<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
	store: Permissions.use,
});
