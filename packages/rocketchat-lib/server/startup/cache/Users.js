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

	findByActiveUsersUsernameExcept(searchTerm, exceptions = [], options = {}) {
		if (!_.isArray(exceptions)) {
			exceptions = [ exceptions ];
		}

		const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');
		const query = {
			$and: [
				{
					active: true,
					username: termRegex
				},
				{
					username: { $nin: exceptions }
				}
			]
		};

		return this.find(query, options);
	}
});
