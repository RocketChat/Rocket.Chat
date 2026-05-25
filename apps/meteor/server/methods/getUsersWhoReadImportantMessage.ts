import { Messages, Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermissionAsync } from '../../app/authorization/server/functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		getUsersWhoReadImportantMessage(messageId: string): Array<{ _id: string; username: string; name?: string }>;
	}
}

Meteor.methods({
	async getUsersWhoReadImportantMessage(messageId: string): Promise<Array<{ _id: string; username: string; name?: string }>> {
		check(messageId, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUsersWhoReadImportantMessage',
			});
		}

		console.log('[getUsersWhoReadImportantMessage] Fetching readers for message:', messageId);

		const message = await Messages.findOneById(messageId);
		if (!message) {
			console.error('[getUsersWhoReadImportantMessage] Message not found:', messageId);
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				method: 'getUsersWhoReadImportantMessage',
			});
		}

		if (!message.isImportant) {
			console.error('[getUsersWhoReadImportantMessage] Message not marked as important:', messageId);
			throw new Meteor.Error('error-not-important-message', 'Message is not marked as important', {
				method: 'getUsersWhoReadImportantMessage',
			});
		}

		const callerSubscription = await Subscriptions.findOneByRoomIdAndUserId(message.rid, userId);
		if (!callerSubscription) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getUsersWhoReadImportantMessage',
			});
		}

		const canViewReaders = await hasAtLeastOnePermissionAsync(
			userId,
			['mark-message-as-important', 'set-important-message-marker'],
			message.rid,
		);

		if (!canViewReaders) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getUsersWhoReadImportantMessage',
			});
		}

		const userIds = message.importantReadBy || [];
		if (userIds.length === 0) {
			console.log('[getUsersWhoReadImportantMessage] No readers yet:', messageId);
			return [];
		}

		const subscriptions = await Subscriptions.find(
			{ rid: message.rid, 'u._id': { $in: userIds } },
			{ projection: { 'u._id': 1, 'u.username': 1, 'u.name': 1 } }
		).toArray();

		const usersInRoom = subscriptions.map(sub => ({
			_id: sub.u._id,
			username: sub.u.username || '',
			name: sub.u.name,
		}));

		console.log('[getUsersWhoReadImportantMessage] Found readers in room:', { 
			messageId, 
			totalRead: userIds.length,
			inRoom: usersInRoom.length 
		});

		return usersInRoom;
	},
});
