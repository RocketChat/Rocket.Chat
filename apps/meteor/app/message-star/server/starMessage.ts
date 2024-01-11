import { api } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { Apps, AppEvents } from '../../../ee/server/apps/orchestrator';
import { broadcastMessageSentEvent } from '../../../server/modules/watchers/lib/messages';
import { canAccessRoomAsync, roomAccessAttributes } from '../../authorization/server';
import { isTheLastMessage } from '../../lib/server/functions/isTheLastMessage';
import { settings } from '../../settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		starMessage(message: Omit<IMessage, 'starred'> & { starred: boolean }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async starMessage(message) {
		const uid = Meteor.userId();

		if (!uid) {
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
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'starMessage' });
		}

		if (!(await canAccessRoomAsync(room, { _id: uid }))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'starMessage' });
		}

		if (isTheLastMessage(room, message)) {
			await Rooms.updateLastMessageStar(room._id, uid, message.starred);
		}

		await Apps.triggerEvent(AppEvents.IPostMessageStarred, message, await Meteor.userAsync(), message.starred);

		await Messages.updateUserStarById(message._id, uid, message.starred);

		void broadcastMessageSentEvent({
			id: message._id,
			broadcastCallback: (message) => api.broadcast('message.sent', message),
		});

		return true;
	},
});
