import { Meteor } from 'meteor/meteor';

import { call } from '../../app/ui-utils/client';
import { SWCache } from '../../app/utils/client';
import { fileUploadHandler } from '../../app/file-upload';

const action = {
	clean: (msg) => {
		delete msg.temp;
		delete msg.tempActions;
		return msg;
	},

	send: (msg) => {
		msg.ts = new Date();
		if (msg.file && msg.meta) {
			action.sendFile(msg);
			return;
		}
		call('sendMessage', msg);
	},

	sendFile: async (msg) => {
		const file = await SWCache.getFileFromCache(msg.file);

		if (!file) { return; }

		const upload = fileUploadHandler('Uploads', msg.meta, file);
		upload.start((error, file, storage) => {
			if (error || !file) { return; }

			const msgData = { id: msg._id, msg: msg.msg, tmid: msg.tmid };
			Meteor.call('sendFileMessage', msg.rid, storage, file, msgData, () => {
				SWCache.removeFromCache(msg.file);
			});
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


Meteor.startup(() => {
	if ('indexedDB' in window) {
		const db = indexedDB.open('localforage');
		let dbExist = true;

		db.onupgradeneeded = function() {
			if (db.result.version === 1) {
				dbExist = false;
			}
		};

		db.onsuccess = function(event) {
			if (!dbExist) { return; }
			const tx = event.target.result.transaction('keyvaluepairs', 'readwrite');
			const store = tx.objectStore('keyvaluepairs');
			store.openCursor("chatMessage").onsuccess = function(event) {
				const cursor = event.target.result;
				if (cursor) {
					if (cursor.value.temp) {
						trigger(cursor.value);
					}
					cursor.continue();
				}
			};
		};
		db.onerror = function() {
			console.log('Error in opening Message persistent Minimongo');
		};
	}
});
