import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		getUsersWhoDidNotReadImportantMessage(messageId: string): Array<{ _id: string; username: string; name?: string }>;
	}
}

Meteor.methods<ServerMethods>({
	async getUsersWhoDidNotReadImportantMessage(messageId: string) {
		check(messageId, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUsersWhoDidNotReadImportantMessage',
			});
		}

		console.log('[getUsersWhoDidNotReadImportantMessage] Fetching users who did not read:', { messageId, userId });

		const message = await Messages.findOneById(messageId);
		if (!message) {
			console.error('[getUsersWhoDidNotReadImportantMessage] Message not found:', messageId);
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				method: 'getUsersWhoDidNotReadImportantMessage',
			});
		}

		if (!message.isImportant) {
			console.error('[getUsersWhoDidNotReadImportantMessage] Message is not important:', messageId);
			throw new Meteor.Error('error-not-important-message', 'Message is not marked as important', {
				method: 'getUsersWhoDidNotReadImportantMessage',
			});
		}

		const readByUserIds = message.importantReadBy || [];

		const subscriptions = await Subscriptions.findByRoomId(message.rid, {
			projection: { u: 1 },
		}).toArray();

		const roomUserIds = subscriptions.map((sub) => sub.u._id);

		const usersWhoDidNotRead = roomUserIds.filter((uid) => !readByUserIds.includes(uid));

		const users = await Promise.all(
			usersWhoDidNotRead.map(async (uid) => {
				const sub = subscriptions.find((s) => s.u._id === uid);
				if (!sub) return null;
				return {
					_id: sub.u._id,
					username: sub.u.username || '',
					name: sub.u.name,
				};
			}),
		);

		const result = users.filter((user): user is { _id: string; username: string; name?: string } => user !== null);

		console.log('[getUsersWhoDidNotReadImportantMessage] Found users who did not read:', {
			messageId,
			count: result.length,
		});

		return result;
	},
});
