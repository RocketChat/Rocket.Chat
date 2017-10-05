RocketChat.authz.cachedCollection = new RocketChat.CachedCollection({
	name: 'permissions',
	eventType: 'onLogged',
	userRelated: false
});
RocketChat.authz.cachedCollection.init();

this.ChatPermissions = RocketChat.authz.cachedCollection.collection;
