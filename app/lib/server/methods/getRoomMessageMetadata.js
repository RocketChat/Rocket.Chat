import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Messages } from '../../../models';
Meteor.methods({
	/**
	 * Non-reactively retrieves metadata about messages of a room
	 * @param {String} roomId
	 * @returns {visibleMessagesCount, lastMessageTimestamp}
	 */
	'getRoomMessageMetadata'(roomId) {

		check(roomId, String);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		const metadata = {};

		metadata.visibleMessagesCount = Messages.findVisibleByRoomId(roomId).count();
		const lastMessage = Messages.getLastVisibleMessageSentWithNoTypeByRoomId(roomId);
		metadata.lastMessageTimestamp = lastMessage && lastMessage.ts;

		return metadata;
	},
});
