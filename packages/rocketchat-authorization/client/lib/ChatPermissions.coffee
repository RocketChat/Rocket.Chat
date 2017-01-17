RocketChat.authz.cachedCollection = new RocketChat.CachedCollection({ name: 'permissions', eventType: 'onLogged' })
@ChatPermissions = RocketChat.authz.cachedCollection.collection
