class ModelBots extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({ 'account._id': 1 });
		this.tryEnsureIndex({ 'account.username': 1 });
		this.tryEnsureIndex({ 'framework': 1 });
		this.tryEnsureIndex({ 'running': 1 });

		this.cache.ensureIndex('account._id', 'unique');
		this.cache.ensureIndex('account.username', 'unique');
	}

	findOneByUsername(username, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${ username }$`, 'i');
		}

		const query = {'account.username': username};

		return this.findOne(query, options);
	}

	findOneById(userId) {
		const query =	{'account._id': userId};

		return this.findOne(query);
	}

	// FIND
	findById(userId) {
		const query = {'account._id': userId};

		return this.find(query);
	}

	findByUsername(username, options) {
		const query = {'account.username': username};

		return this.find(query, options);
	}

	findByFramework(framework, options) {
		const query = {framework};

		return this.find(query, options);
	}
}

RocketChat.models.Users = new ModelBots('bot', true);
