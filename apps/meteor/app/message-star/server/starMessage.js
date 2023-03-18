import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import { isTheLastMessage } from '../../lib/server';
import { canAccessRoomAsync, roomAccessAttributes } from '../../authorization/server';
import { Subscriptions, Rooms, Messages } from '../../models/server';
import { Apps, AppEvents } from '../../../ee/server/apps/orchestrator';

Meteor.methods({
	async starMessage(message) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'starMessage',
			});
		}

		if (!settings.get('Message_AllowStarring')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message starring not allowed', {
				method: 'starMessage',
				action: 'Message_starring',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), {
			fields: { _id: 1 },
		});
		if (!subscription) {
			return false;
		}
		if (!Messages.findOneByRoomIdAndMessageId(message.rid, message._id)) {
			return false;
		}

		const room = Rooms.findOneById(message.rid, { fields: { ...roomAccessAttributes, lastMessage: 1 } });

		if (!(await canAccessRoomAsync(room, { _id: Meteor.userId() }))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'starMessage' });
		}

		if (isTheLastMessage(room, message)) {
			Rooms.updateLastMessageStar(room._id, Meteor.userId(), message.starred);
		}

		await Apps.triggerEvent(AppEvents.IPostMessageStarred, message, Meteor.user(), message.starred);

		return Messages.updateUserStarById(message._id, Meteor.userId(), message.starred);
	},
});
