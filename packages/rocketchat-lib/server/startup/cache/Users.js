/* eslint new-cap: 0 */

RocketChat.cache.Users = new (class CacheUser extends RocketChat.cache._Base {
	constructor() {
		super('Users');
	}
});
