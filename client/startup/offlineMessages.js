import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { sortBy } from 'underscore';
import localforage from 'localforage';

import { call } from '../../app/ui-utils/client';
import { getConfig } from '../../app/ui-utils/client/config';
import { SWCache } from '../../app/utils/client';
import { fileUploadHandler } from '../../app/file-upload';
import { ChatMessage, CachedChatMessage } from '../../app/models/client';

const action = {
	clean: (msg) => {
		delete msg.temp;
		delete msg.tempActions;
		return msg;
	},

	send: (msg) => {
		if (msg.file && msg.meta) {
			action.sendFile(msg);
			return;
		}

		call('sendMessage', msg, true);
	},

	sendFile: async (msg) => {
		const file = await SWCache.getFileFromCache(msg.file);
		const uploading = {
			id: msg.file._id,
			name: msg.file.name,
			percentage: 0,
		};

		if (!file) { return; }

		const upload = fileUploadHandler('Uploads', msg.meta, file);

		// Session.set(`uploading-${msg.file._id}`, uploading);

		upload.onProgress = (progress) => {
			const uploads = uploading;
			uploads.percentage = Math.round(progress * 100) || 0;
			ChatMessage.setProgress(msg._id, uploads);
		};

		upload.start((error, file, storage) => {
			if (error) {
				ChatMessage.setProgress(msg._id, uploading);
				return;
			}

			if (!file) {
				return;
			}

			const msgData = { id: msg._id, msg: msg.msg, tmid: msg.tmid };

			Meteor.call('sendFileMessage', msg.rid, storage, file, msgData, () => {
				SWCache.removeFromCache(msg.file);
			});
		});

		Tracker.autorun((computation) => {
			// using file._id as initial upload id, as messsageAttachment have access to file._id
			const isCanceling = Session.get(`uploading-cancel-${ msg.file._id }`);
			if (!isCanceling) {
				return;
			}

			computation.stop();
			upload.stop();

			ChatMessage.setProgress(msg._id, uploading);
		});
	},

	update: (msg) => {
		msg.editedAt = new Date();
		call('updateMessage', msg);
	},

	react: ({ _id }, reaction) => {
		call('setReaction', reaction, _id);
	},

	delete: ({ _id }) => call('deleteMessage', { _id }),
};

function trigger(msg) {
	const tempActions = msg.tempActions || {};
	msg = action.clean(msg);

	if (tempActions.send) {
		action.send(msg);
		return;
	}

	if (tempActions.delete) {
		action.delete(msg);
		return;
	}

	if (tempActions.update) {
		action.update(msg);
	}

	if (tempActions.react && tempActions.reactions) {
		tempActions.reactions.forEach((reaction) => {
			action.react(msg, reaction);
		});
	}
}

function triggerOfflineMsgs(messages) {
	const tempMsgs = messages.filter((msg) => msg.temp);
	tempMsgs.forEach((msg) => trigger(msg));
}

const retainMessages = (rid, messages) => {
	const roomMsgs = messages.filter((msg) => rid === msg.rid);
	const limit = parseInt(getConfig('roomListLimit')) || 50;
	const retain = sortBy(roomMsgs.filter((msg) => !msg.temp), 'ts').reverse().slice(0, limit);
	retain.push(...messages.filter((msg) => rid === msg.rid && msg.temp));
	return retain;
};

function clearOldMessages({ records: messages, ...value }) {
	const rids = [...new Set(messages.map((msg) => msg.rid))];
	const retain = [];
	rids.forEach((rid) => {
		retain.push(...retainMessages(rid, messages));
	});
	value.records = retain;
	value.updatedAt = new Date();
	localforage.setItem('chatMessage', value).then(() => {
		CachedChatMessage.loadFromCache();
	});
}

Meteor.startup(() => {
	localforage.getItem('chatMessage').then((value) => {
		if (value && value.records) {
			triggerOfflineMsgs(value.records);
			clearOldMessages(value);
		}
	});
});
