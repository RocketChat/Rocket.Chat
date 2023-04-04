import type { IEditedMessage, IMessage, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Messages, Rooms } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { Apps } from '../../../../ee/server/apps';
import { parseUrlsInMessage } from './parseUrlsInMessage';

export const updateMessage = async function (message: IMessage, user: IUser, originalMsg?: IMessage): Promise<void> {
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

	Object.assign<IMessage, Omit<IEditedMessage, keyof IMessage>>(message, {
		editedAt: new Date(),
		editedBy: {
			_id: user._id,
			username: user.username,
		},
	});

	parseUrlsInMessage(message);

	message = callbacks.run('beforeSaveMessage', message);

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

	const room = await Rooms.findOneById(message.rid);

	if (!room) {
		return;
	}

	if (Apps?.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		void Apps.getBridges()?.getListenerBridge().messageEvent('IPostMessageUpdated', message);
	}

	Meteor.defer(async function () {
		const msg = await Messages.findOneById(_id);
		if (msg) {
			callbacks.run('afterSaveMessage', msg, room, user._id);
		}
	});
};
