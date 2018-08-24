RocketChat.authz.cachedCollection = new RocketChat.CachedCollection({
	name: 'permissions',
	eventType: 'onLogged'
});

this.ChatPermissions = RocketChat.authz.cachedCollection.collection;
