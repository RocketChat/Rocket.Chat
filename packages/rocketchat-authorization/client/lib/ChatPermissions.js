import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.authz.cachedCollection = new RocketChat.CachedCollection({
	name: 'permissions',
	eventType: 'onLogged',
});

export const ChatPermissions = RocketChat.authz.cachedCollection.collection;
