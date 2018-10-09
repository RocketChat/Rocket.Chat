import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Rooms.setE2eKeyId = function(_id, e2eKeyId, options) {
	const query = {
		_id,
	};

	const update = {
		$set: {
			e2eKeyId,
		},
	};

	return this.update(query, update, options);
};
