RocketChat.models.Messages.keepHistoryForToken = function(token) {
	return this.update(
		{
			'navigation.token': token,
			expireAt: {
				$exists: true
			}
		},
		{
			$unset: {
				expireAt: 1
			}
		},
		{
			multi: true
		}
	);
};

RocketChat.models.Messages.setRoomIdByToken = function(token, roomId) {
	return this.update(
		{
			'navigation.token': token,
			rid: null
		},
		{
			$set: {
				rid: roomId
			}
		},
		{
			multi: true
		}
	);
};
