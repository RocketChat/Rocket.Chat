import { api, Message } from '@rocket.chat/core-services';
import type { IEditedMessage, IMessage, IUser, AtLeast } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../../../../ee/server/apps';
import { callbacks } from '../../../../lib/callbacks';
import { broadcastMessageFromData } from '../../../../server/modules/watchers/lib/messages';
import { settings } from '../../../settings/server';
import { parseUrlsInMessage } from './parseUrlsInMessage';

export const updateMessage = async function (
	message: AtLeast<IMessage, '_id' | 'rid' | 'msg'>,
	user: IUser,
	originalMsg?: IMessage,
	previewUrls?: string[],
): Promise<void> {
	const originalMessage = originalMsg || (await Messages.findOneById(message._id));

	// For the Rocket.Chat Apps :)
	if (message && Apps && Apps.isLoaded()) {
		const appMessage = Object.assign({}, originalMessage, message);

		const prevent = await Apps.getBridges()?.getListenerBridge().messageEvent('IPreMessageUpdatedPrevent', appMessage);
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-updating', 'A Rocket.Chat App prevented the message updating.');
		}

		let result;
		result = await Apps.getBridges()?.getListenerBridge().messageEvent('IPreMessageUpdatedExtend', appMessage);
		result = await Apps.getBridges()?.getListenerBridge().messageEvent('IPreMessageUpdatedModify', result);

		if (typeof result === 'object') {
			message = Object.assign(appMessage, result);
		}
	}

	// If we keep history of edits, insert a new message to store history information
	if (settings.get('Message_KeepHistory')) {
		await Messages.cloneAndSaveAsHistoryById(message._id, user as Required<Pick<IUser, '_id' | 'username' | 'name'>>);
	}

	Object.assign<AtLeast<IMessage, '_id' | 'rid' | 'msg'>, Omit<IEditedMessage, keyof IMessage>>(message, {
		editedAt: new Date(),
		editedBy: {
			_id: user._id,
			username: user.username,
		},
	});

	parseUrlsInMessage(message, previewUrls);

	const room = await Rooms.findOneById(message.rid);
	if (!room) {
		return;
	}

	// TODO remove type cast
	message = await Message.beforeSave({ message: message as IMessage, room, user });

	const { _id, ...editedMessage } = message;

	if (!editedMessage.msg) {
		delete editedMessage.md;
	}

	// do not send $unset if not defined. Can cause exceptions in certain mongo versions.
	await Messages.updateOne(
		{ _id },
		{
			$set: {
				...editedMessage,
			},
			...(!editedMessage.md && { $unset: { md: 1 } }),
		},
	);

	if (Apps?.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		void Apps.getBridges()?.getListenerBridge().messageEvent('IPostMessageUpdated', message);
	}

	setImmediate(async () => {
		const msg = await Messages.findOneById(_id);
		if (msg) {
			await callbacks.run('afterSaveMessage', msg, room, user._id);
			void api.broadcast('room.afterSaveMessage', msg, room);
			void broadcastMessageFromData({
				id: msg._id,
				data: msg,
			});
		}
	});
};
