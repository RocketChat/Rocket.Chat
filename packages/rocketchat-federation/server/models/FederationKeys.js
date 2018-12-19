class FederationKeys extends RocketChat.models._Base {
	constructor() {
		super('federation_keys');
	}

	setPublicKey(key) {
		return this.insert({ type: 'public', key });
	}

	getPublicKey() {
		return this.findOne({ type: 'public' }).key;
	}

	setPrivateKey(key) {
		return this.insert({ type: 'private', key });
	}

	getPrivateKey() {
		return this.findOne({ type: 'private' }).key;
	}
}

RocketChat.models.FederationKeys = new FederationKeys();
