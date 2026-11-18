import { Apps, AppEvents } from '@rocket.chat/apps';
import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, Rooms } from '@rocket.chat/models';

import { settings } from '../../../settings';
import { canAccessRoomAsync, roomAccessAttributes } from '../../authorization';
import { isTheLastMessage } from '../../messages/isTheLastMessage';
import { notifyOnRoomChangedById, notifyOnMessageChange } from '../../notifyListener';

export const starMessage = async (user: IUser, message: Pick<IMessage, 'rid' | '_id'> & { starred: boolean }): Promise<boolean> => {
	if (!settings.get('Message_AllowStarring')) {
		throw new ClientSafeError('error-action-not-allowed', 'Message starring not allowed', {
			method: 'starMessage',
			action: 'Message_starring',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(message.rid, user._id, {
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
		throw new ClientSafeError('error-not-allowed', 'Not allowed', { method: 'starMessage' });
	}

	if (!(await canAccessRoomAsync(room, { _id: user._id }))) {
		throw new ClientSafeError('not-authorized', 'Not Authorized', { method: 'starMessage' });
	}

	if (isTheLastMessage(room, message)) {
		await Rooms.updateLastMessageStar(room._id, user._id, message.starred);
		void notifyOnRoomChangedById(room._id);
	}

	await Apps.self?.triggerEvent(AppEvents.IPostMessageStarred, message, user, message.starred);

	await Messages.updateUserStarById(message._id, user._id, message.starred);

	void notifyOnMessageChange({
		id: message._id,
	});

	return true;
};
