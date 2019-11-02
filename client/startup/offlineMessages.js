import { Meteor } from 'meteor/meteor';

import { call } from '../../app/ui-utils/client';

const action = {
	clean: (msg) => {
		delete msg.temp;
		delete msg.tempActions;
		return msg;
	},

	send: (msg) => {
		msg.ts = new Date();
		call('sendMessage', msg);
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
		const db = indexedDB.open('persistent-minimongo2-Message');
		let dbExist = true;

		db.onupgradeneeded = function() {
			if (db.result.version === 1) {
				dbExist = false;
			}
		};

		db.onsuccess = function(event) {
			if (!dbExist) { return; }
			const tx = event.target.result.transaction('minimongo', 'readwrite');
			const store = tx.objectStore('minimongo');
			store.openCursor().onsuccess = function(event) {
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
