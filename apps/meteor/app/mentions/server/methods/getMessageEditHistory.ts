import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Messages, Rooms } from '@rocket.chat/models';
import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';

Meteor.methods({
	async getMessageEditHistory(messageId: string) {
		check(messageId, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessageEditHistory' });
		}

		// Get the current message
		const currentMessage = await Messages.findOneById(messageId);
		if (!currentMessage) {
			throw new Meteor.Error('error-message-not-found', 'Message not found', { method: 'getMessageEditHistory' });
		}

		// Check if user has access to the room
		const room = await Rooms.findOneById(currentMessage.rid);
		if (!room || !(await canAccessRoomIdAsync(currentMessage.rid, userId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getMessageEditHistory' });
		}

		// Check if user is the message author
		if (currentMessage.u._id !== userId) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getMessageEditHistory' });
		}

		// Get all history versions (stored with _hidden: true and parent: messageId)
		const historyMessages = await Messages.find(
			{
				_hidden: true,
				parent: messageId,
			},
			{
				sort: { editedAt: 1 },
			}
		).toArray();

		// Return current message + all history versions
		return {
			current: currentMessage,
			history: historyMessages,
		};
	},
});
