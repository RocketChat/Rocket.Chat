RocketChat.authz.cachedCollection = new RocketChat.CachedCollection({ name: 'permissions', methodName: 'getPermissions', eventName: 'permissions-changed', eventType: 'onAll' })
@ChatPermissions = RocketChat.authz.cachedCollection.collection

RocketChat.authz.cachedCollection.init()
