import type { IPermission } from '@rocket.chat/core-typings';
import type { StoreApi, UseBoundStore } from 'zustand';

import { PrivateCachedCollection } from '../../../../client/lib/cachedCollections';
import type { IDocumentMapStore } from '../../../../client/lib/cachedCollections/DocumentMapStore';

type PermissionsStore = {
	use: UseBoundStore<StoreApi<IDocumentMapStore<IPermission>>>;
	readonly state: IDocumentMapStore<IPermission>;
};

export const AuthzCachedCollection = new PrivateCachedCollection<IPermission>({
	name: 'permissions',
	eventType: 'notify-logged',
});

// We are restricting the type of the collection, removing Minimongo methods to avoid further usage, until full conversion to zustand store
export const Permissions = AuthzCachedCollection.collection as PermissionsStore;
