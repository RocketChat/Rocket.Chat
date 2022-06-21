import { Meteor } from 'meteor/meteor';
import type { IMessage, IUser } from '@rocket.chat/core-typings';

import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import { Messages, Rooms } from '../../../models/server';
import { Uploads } from '../../../models/server/raw';
import { api } from '../../../../server/sdk/api';
import { callbacks } from '../../../../lib/callbacks';
import { Apps } from '../../../apps/server';

export const deleteMessage = async function (message: IMessage, user: IUser): Promise<void> {
	const deletedMsg = Messages.findOneById(message._id);
	const isThread = deletedMsg.tcount > 0;
	const keepHistory = settings.get('Message_KeepHistory') || isThread;
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus') || isThread;
	const bridges = Apps?.isLoaded() && Apps.getBridges();

	if (deletedMsg && bridges) {
		const prevent = Promise.await(bridges.getListenerBridge().messageEvent('IPreMessageDeletePrevent', deletedMsg));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the message deleting.');
		}
	}

	if (deletedMsg.tmid) {
		Messages.decreaseReplyCountById(deletedMsg.tmid, -1);
	}

	const files = (message.files || [message.file]).filter(Boolean); // Keep compatibility with old messages

	if (keepHistory) {
		if (showDeletedStatus) {
			Messages.cloneAndSaveAsHistoryById(message._id, user);
		} else {
			Messages.setHiddenById(message._id, true);
		}

		for await (const file of files) {
			file?._id && (await Uploads.update({ _id: file._id }, { $set: { _hidden: true } }));
		}
	} else {
		if (!showDeletedStatus) {
			Messages.removeById(message._id);
		}

		files.forEach((file) => {
			file?._id && FileUpload.getStore('Uploads').deleteById(file._id);
		});
	}

	const room = Rooms.findOneById(message.rid, { fields: { lastMessage: 1, prid: 1, mid: 1 } });
	callbacks.run('afterDeleteMessage', deletedMsg, room);

	// update last message
	if (settings.get('Store_Last_Message')) {
		if (!room.lastMessage || room.lastMessage._id === message._id) {
			Rooms.resetLastMessageById(message.rid, message._id);
		}
	}

	// decrease message count
	Rooms.decreaseMessageCountById(message.rid, 1);

	if (showDeletedStatus) {
		Messages.setAsDeletedByIdAndUser(message._id, user);
	} else {
		api.broadcast('notify.deleteMessage', message.rid, { _id: message._id });
	}

	if (bridges) {
		bridges.getListenerBridge().messageEvent('IPostMessageDeleted', deletedMsg, user);
	}
};
