import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Rooms.updateLastMessageStar = function(roomId, userId, starred) {
	let update;
	const query = { _id: roomId };

	if (starred) {
		update = {
			$addToSet: {
				'lastMessage.starred': { _id: userId },
			},
		};
	} else {
		update = {
			$pull: {
				'lastMessage.starred': { _id: userId },
			},
		};
	}

	return this.update(query, update);
};

