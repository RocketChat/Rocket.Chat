import { Messages, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

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

		const userIds = message.importantReadBy || [];
		if (userIds.length === 0) {
			console.log('[getUsersWhoReadImportantMessage] No readers yet:', messageId);
			return [];
		}

		const users = await Users.find(
			{ _id: { $in: userIds } },
			{ projection: { _id: 1, username: 1, name: 1 } }
		).toArray();

		console.log('[getUsersWhoReadImportantMessage] Found readers:', { messageId, count: users.length });

		return users.map(user => ({
			_id: user._id,
			username: user.username || '',
			name: user.name,
		}));
	},
});
