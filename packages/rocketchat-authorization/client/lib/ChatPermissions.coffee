RocketChat.authz.cachedCollection = new RocketChat.CachedCollection({ name: 'permissions', eventType: 'onAll' })
@ChatPermissions = RocketChat.authz.cachedCollection.collection

RocketChat.authz.cachedCollection.init()
