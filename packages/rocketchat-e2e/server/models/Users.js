RocketChat.models.Users.addKeyToChainByUserId = function(userId, key) {
	this.update({ _id: userId }, {
		$set: {
			'e2e.public_key': key.public_key,
			'e2e.private_key': key.private_key,
		},
	});
};

RocketChat.models.Users.fetchKeychain = function(userId) {
	const user = this.findOne({ _id: userId }, { fields: { 'e2e.public_key': 1 } });

	if (!user || !user.e2e || !user.e2e.public_key) {
		return;
	}

	return {
		public_key: user.e2e.public_key,
	};
};

RocketChat.models.Users.fetchKeysByUserId = function(userId) {
	const user = this.findOne({ _id: userId }, { fields: { e2e: 1 } });

	if (!user || !user.e2e || !user.e2e.public_key) {
		return {};
	}

	return {
		public_key: user.e2e.public_key,
		private_key: user.e2e.private_key,
	};
};

RocketChat.models.Users.emptyKeychainByUserId = function(userId) {
	this.update({ _id: userId }, {
		$unset: {
			e2e: 1,
		},
	});
};
