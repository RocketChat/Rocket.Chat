/* eslint new-cap: 0 */

RocketChat.cache.Users = new (class CacheUser extends RocketChat.cache._Base {
	constructor() {
		super('Users');
	}

	// Find
	findByUsername(username, options) {
		const query = {
			username: username
		};

		return this.find(query, options);
	}
});
