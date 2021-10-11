import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { getUserPreference } from '../../../app/utils/client';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = getUserPreference(Meteor.userId(), 'useEmojis');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'emoji');
			return;
		}

		import('../../../app/emoji/client').then(({ createEmojiMessageRenderer }) => {
			const renderMessage = createEmojiMessageRenderer();
			callbacks.remove('renderMessage', 'emoji');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.LOW, 'emoji');
		});
	});
});
