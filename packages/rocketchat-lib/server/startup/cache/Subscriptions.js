/* eslint new-cap: 0 */

RocketChat.cache.Subscriptions = new (class CacheSubscription extends RocketChat.cache._Base {
	constructor() {
		super('Subscriptions');

		this.ensureIndex('rid', 'array');
		this.ensureIndex('u._id', 'array');
		this.ensureIndex(['rid', 'u._id'], 'unique');
	}

	findByUserId(userId, options) {
		return this.findByIndex('u._id', userId, options);
	}

	findOneByRidAndUserId(rid, userId, options) {
		return this.findByIndex('rid,u._id', [rid, userId], options).fetch();
	}
});
