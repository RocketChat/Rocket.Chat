RocketChat.authz.cachedCollection = new RocketChat.CachedCollection({ name: 'permissions', eventType: 'onLogged', initOnLogin: true })
@ChatPermissions = RocketChat.authz.cachedCollection.collection
