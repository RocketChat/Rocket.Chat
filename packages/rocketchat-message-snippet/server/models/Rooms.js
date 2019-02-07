import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Rooms.setLastMessageSnippeted = function(roomId, message, snippetName, snippetedBy, snippeted, snippetedAt) {
	const query =	{ _id: roomId };

	const msg = `\`\`\`${ message.msg }\`\`\``;

	const update = {
		$set: {
			'lastMessage.msg': msg,
			'lastMessage.snippeted': snippeted,
			'lastMessage.snippetedAt': snippetedAt || new Date,
			'lastMessage.snippetedBy': snippetedBy,
			'lastMessage.snippetName': snippetName,
		},
	};

	return this.update(query, update);
};
