import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { getUserPreference } from '../../../app/utils';
import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const isEnabled = getUserPreference(Meteor.userId(), 'useEmojis');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'emoji');
			return;
		}

		const { createEmojiMessageRenderer } = await import('../../../app/emoji/client');

		const renderMessage = createEmojiMessageRenderer();

		callbacks.add('renderMessage', renderMessage, callbacks.priority.LOW, 'emoji');
	});
});
