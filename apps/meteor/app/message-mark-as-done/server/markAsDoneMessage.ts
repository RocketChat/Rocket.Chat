import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync, roomAccessAttributes } from '../../authorization/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		markAsDoneMessage(message: Omit<IMessage, 'markedAsDone'> & { markedAsDone: boolean }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async markAsDoneMessage(message) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'markAsDoneMessage',
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(message.rid, uid, {
			projection: { _id: 1 },
		});
		if (!subscription) {
			return false;
		}
		if (!(await Messages.findOneByRoomIdAndMessageId(message.rid, message._id))) {
			return false;
		}

		const room = await Rooms.findOneById(message.rid, { projection: { ...roomAccessAttributes, lastMessage: 1 } });

		if (!room) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'markAsDoneMessage' });
		}

		if (!(await canAccessRoomAsync(room, { _id: uid }))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'markAsDoneMessage' });
		}

		await Messages.updateUserMarkedAsDoneById(message._id, uid, message.markedAsDone);

		return true;
	},
});
