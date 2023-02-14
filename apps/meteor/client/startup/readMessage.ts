import { Meteor } from 'meteor/meteor';

import { readMessage } from '../../app/ui-utils/client';

Meteor.startup(() => {
	window.addEventListener('blur', () => {
		readMessage.disable();
	});

	window.addEventListener('focus', () => {
		readMessage.enable();
		readMessage.read();
	});

	window.addEventListener('touchend', () => {
		readMessage.enable();
	});

	window.addEventListener('keyup', (event) => {
		const key = event.which;
		if (key === 27) {
			// ESCAPE KEY
			const rid = Session.get('openedRoom');
			if (!rid) {
				return;
			}
			readMessage.readNow(rid);
			readMessage.refreshUnreadMark(rid);
		}
	});
});
