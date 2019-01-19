import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Messages.keepHistoryForToken = function(token) {
	return this.update({
		'navigation.token': token,
		expireAt: {
			$exists: true,
		},
	}, {
		$unset: {
			expireAt: 1,
		},
	}, {
		multi: true,
	});
};

RocketChat.models.Messages.setRoomIdByToken = function(token, rid) {
	return this.update({
		'navigation.token': token,
		rid: null,
	}, {
		$set: {
			rid,
		},
	}, {
		multi: true,
	});
};
