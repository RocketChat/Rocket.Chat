import { Apps, AppEvents } from '@rocket.chat/apps';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Subscriptions, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync, roomAccessAttributes } from '../../authorization/server';
import { isTheLastMessage } from '../../lib/server/functions/isTheLastMessage';
import { notifyOnRoomChangedById, notifyOnMessageChange } from '../../lib/server/lib/notifyListener';
import { settings } from '../../settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		starMessage(message: Pick<IMessage, 'rid' | '_id'> & { starred: boolean }): boolean;
	}
}

export const starMessage = async (userId: string, message: Pick<IMessage, 'rid' | '_id'> & { starred: boolean }): Promise<boolean> => {
	if (!settings.get('Message_AllowStarring')) {
		throw new Meteor.Error('error-action-not-allowed', 'Message starring not allowed', {
			method: 'starMessage',
			action: 'Message_starring',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(message.rid, userId, {
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
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'starMessage' });
	}

	if (!(await canAccessRoomAsync(room, { _id: userId }))) {
		throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'starMessage' });
	}

	if (isTheLastMessage(room, message)) {
		await Rooms.updateLastMessageStar(room._id, userId, message.starred);
		void notifyOnRoomChangedById(room._id);
	}

	await Apps.self?.triggerEvent(AppEvents.IPostMessageStarred, message, await Meteor.userAsync(), message.starred);

	await Messages.updateUserStarById(message._id, userId, message.starred);

	void notifyOnMessageChange({
		id: message._id,
	});

	return true;
};

Meteor.methods<ServerMethods>({
	async starMessage(message) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'starMessage',
			});
		}

		return starMessage(uid, message);
	},
});
