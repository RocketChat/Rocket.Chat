import { Message } from '@rocket.chat/core-services';
import { Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

export const saveReplyWhenReadOnly = async function (
	rid: string,
	allowReply: boolean,
	user: {
		_id: string;
		username: string;
	},
	sendMessage = true,
) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveReplyWhenReadOnly',
		});
	}

	const result = await Rooms.setAllowReplyingWhenReadOnlyById(rid, allowReply);

	if (result.modifiedCount && sendMessage) {
		const type = allowReply ? 'room-allowed-replying' : 'room-disallowed-replying';

		await Message.saveSystemMessage(type, rid, '', user);
	}
};
