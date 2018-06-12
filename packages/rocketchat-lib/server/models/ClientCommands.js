class ModelClientCommands extends RocketChat.models._Base {
	constructor() {
		super('clientcommand');

		this.tryEnsureIndex({ 'ts': 1 });
		this.tryEnsureIndex({ 'u': 1 });
	}

	// FIND
	findByUsername(username, options) {
		const query = { 'u.username': username };

		return this.find(query, options);
	}

	findById(userId, options) {
		const query = { 'u._id': userId };

		return this.find(query, options);
	}
}

RocketChat.models.ClientCommands = new ModelClientCommands('clientcommand', true);
