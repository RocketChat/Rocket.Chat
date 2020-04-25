import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { sortBy } from 'underscore';
import localforage from 'localforage';

import { call } from '../../../ui-utils/client';
import { getConfig } from '../../../ui-utils/client/config';
import { ChatMessage, CachedChatMessage } from '../../../models/client';

import { SWCache, APIClient } from '..';

const action = {
	clean: (msg) => {
		const { temp, tempActions, ...originalMsg } = msg;
		return originalMsg;
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
		const upload = {
			id: msg.file._id,
			name: msg.file.name,
			percentage: 0,
		};

		if (!file) { return; }

		const data = new FormData();
		msg.meta.description && data.append('description', msg.meta.description);
		data.append('id', msg._id);
		msg.msg && data.append('msg', msg.msg);
		msg.tmid && data.append('tmid', msg.tmid);
		data.append('file', file, msg.file.name);
		const { xhr, promise } = APIClient.upload(`v1/rooms.upload/${ msg.rid }`, {}, data, {
			progress(progress) {
				if (progress === 100) {
					return;
				}
				const uploads = upload;
				uploads.percentage = Math.round(progress) || 0;
				ChatMessage.setProgress(msg._id, uploads);
			},
			error(error) {
				const uploads = upload;
				uploads.error = (error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error) || error.message;
				uploads.percentage = 0;
				ChatMessage.setProgress(msg._id, uploads);
			},
		});

		Tracker.autorun((computation) => {
			const isCanceling = Session.get(`uploading-cancel-${ upload.id }`);

			if (!isCanceling) {
				return;
			}
			computation.stop();
			Session.delete(`uploading-cancel-${ upload.id }`);

			xhr.abort();
		});

		try {
			const res = await promise;

			if (typeof res === 'object' && res.success) { SWCache.removeFromCache(msg.file); }
		} catch (error) {
			const uploads = upload;
			uploads.error = (error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error) || error.message;
			uploads.percentage = 0;
			ChatMessage.setProgress(msg._id, uploads);
		}
	},

	update: (msg) => {
		msg.editedAt = new Date();
		call('updateMessage', msg, true);
	},

	react: ({ _id }, reaction) => {
		call('setReaction', reaction, _id, undefined, true);
	},

	delete: ({ _id }) => call('deleteMessage', { _id }, true),
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

export const triggerOfflineMsgs = () => {
	localforage.getItem('chatMessage').then((value) => {
		if (value && value.records) {
			const tempMsgs = value.records.filter((msg) => msg.temp);
			tempMsgs.forEach((msg) => trigger(msg));
		}
	});
};

const retainMessages = (rid, messages) => {
	const roomMsgs = messages.filter((msg) => rid === msg.rid);
	const limit = parseInt(getConfig('roomListLimit')) || 50;
	const retain = sortBy(roomMsgs.filter((msg) => !msg.temp), 'ts').reverse().slice(0, limit);
	retain.push(...roomMsgs.filter((msg) => msg.temp));
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

export const cleanMessagesAtStartup = () => {
	localforage.getItem('chatMessage').then((value) => {
		if (value && value.records) {
			clearOldMessages(value);
		}
	});
};
