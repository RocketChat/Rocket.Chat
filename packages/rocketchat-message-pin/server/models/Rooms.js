import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Rooms.setLastMessagePinned = function(roomId, pinnedBy, pinned, pinnedAt) {
	const query = { _id: roomId };

	const update = {
		$set: {
			'lastMessage.pinned': pinned,
			'lastMessage.pinnedAt': pinnedAt || new Date,
			'lastMessage.pinnedBy': pinnedBy,
		},
	};

	return this.update(query, update);
};
