RocketChat.authz.cachedCollection = new RocketChat.CachedCollection({ name: 'permissions', eventType: 'onAll', initOnLogin: true })
@ChatPermissions = RocketChat.authz.cachedCollection.collection
