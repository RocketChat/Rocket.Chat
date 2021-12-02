import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../app/callbacks/lib/callbacks';
import { getUserPreference } from '../../../app/utils/client';

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
