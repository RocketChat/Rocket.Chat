import { CachedCollection } from './CachedCollection';

export const AuthzCachedCollection = new CachedCollection({
	name: 'permissions',
	eventType: 'onLogged',
});

export const ChatPermissions = AuthzCachedCollection.collection;
