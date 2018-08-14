RocketChat.models.Users.setTokenpassTcaBalances = function(_id, tcaBalances) {
	const update = {
		$set: {
			'services.tokenpass.tcaBalances': tcaBalances
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
			'services.tokenpass.tcaBalances': 1
		}
	};

	return this.findOne(query, options);
};
