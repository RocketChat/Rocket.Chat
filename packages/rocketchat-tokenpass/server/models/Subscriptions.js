RocketChat.models.Subscriptions.findByRoomIds = function(roomIds) {
	const query = {
		rid: {
			$in: roomIds
		}
	};
	const options = {
		fields: {
			'u._id': 1,
			rid: 1
		}
	};

	return this._db.find(query, options);
};
