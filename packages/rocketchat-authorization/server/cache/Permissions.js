/* eslint new-cap: 0 */

RocketChat.cache.Permissions = new (class CachePermission extends RocketChat.cache._Base {
	constructor() {
		super('Permissions');
	}
});

RocketChat.cache.Permissions.load();
