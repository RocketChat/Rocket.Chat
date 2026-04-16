import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		toggleImportantMessageRead(messageId: string): boolean;
	}
}

Meteor.methods({
	async toggleImportantMessageRead(messageId: string): Promise<boolean> {
		check(messageId, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleImportantMessageRead',
			});
		}

		const message = await Messages.findOneById(messageId);
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				method: 'toggleImportantMessageRead',
			});
		}

		if (!message.isImportant) {
			throw new Meteor.Error('error-not-important-message', 'Message is not marked as important', {
				method: 'toggleImportantMessageRead',
			});
		}

		const importantReadBy = message.importantReadBy || [];
		const isRead = importantReadBy.includes(userId);

		if (isRead) {
			await Messages.updateOne(
				{ _id: messageId },
				{ $pull: { importantReadBy: userId } }
			);
		} else {
			await Messages.updateOne(
				{ _id: messageId },
				{ $addToSet: { importantReadBy: userId } }
			);
		}

		return !isRead;
	},
});
