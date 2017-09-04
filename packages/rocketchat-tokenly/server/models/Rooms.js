RocketChat.models.Rooms.findByToknepass = function(tokens) {
	const query = {
		'tokenpass.tokens.token': {
			$in: tokens
		}
	};

	return this._db.find(query).fetch();
};

RocketChat.models.Rooms.setTokensById = function(_id, tokens) {
	const update = {
		$set: {
			'tokenpass.tokens.token': tokens
		}
	};

	return this.update({_id}, update);
};

RocketChat.models.Rooms.setTokenpassById = function(_id, tokenpass) {
	const update = {
		$set: {
			tokenpass
		}
	};

	return this.update({ _id }, update);
};
