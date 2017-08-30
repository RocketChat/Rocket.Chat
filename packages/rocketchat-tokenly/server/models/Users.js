RocketChat.models.Users.setTokenlyTcaBalances = function(_id, tcaBalances) {
	const update = {
		$set: {
			'services.tokenly.tcaBalances': tcaBalances
		}
	};

	return this.update(_id, update);
};

RocketChat.models.Users.getTokenBalancesByUserId = function(userId) {
	const query = {
		_id: userId
	};

	const options = {
		fields: {
			'services.tokenly.tcaBalances': 1
		}
	};

	return this.findOne(query, options);
};
