RocketChat.models.CredentialTokens = new class extends RocketChat.models._Base {
	constructor() {
		super('credential_tokens');

		this.tryEnsureIndex({ 'expireAt': 1 }, { sparse: 1, expireAfterSeconds: 0 });
	}

	create(_id, userInfo) {
		const validForMilliseconds = 60000;		// Valid for 60 seconds
		const token = {
			_id,
			userInfo,
			expireAt: new Date(Date.now() + validForMilliseconds)
		};

		this.insert(token);
		return token;
	}

	findOneById(_id) {
		const query = {
			_id,
			expireAt: { $gt: new Date() }
		};

		return this.findOne(query);
	}
};
