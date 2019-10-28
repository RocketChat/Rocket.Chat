import { Meteor } from 'meteor/meteor';

import { call } from '../../app/ui-utils/client';

Meteor.startup(() => {
	function sendOfflineMessage(message) {
		message.ts = new Date();
		delete message.temp;
		call('sendMessage', message);
	}

	function updateOfflineMessage(message) {
		message.editedAt = new Date();
		delete message.tempEdit;
		call('updateMessage', message);
	}

	// function reactionOfflineMessage({_id, msg}) {
	//     const reaction = msg.slice(1).trim();
	//     call('setReaction', reaction, _id);
	// }

	function deleteOfflineMessage({ _id }) {
		call('deleteMessage', { _id });
	}

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
						console.log(cursor.value);
						sendOfflineMessage(cursor.value);
					} else if (cursor.value.tempEdit) {
						console.log(cursor.value);
						updateOfflineMessage(cursor.value);
						// } else if (cursor.value.tempReact) {
						//     console.log(cursor.value);
						//     reactionOfflineMessage(cursor.value);
					} else if (cursor.value.tempDelete) {
						console.log(cursor.value);
						deleteOfflineMessage(cursor.value);
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
