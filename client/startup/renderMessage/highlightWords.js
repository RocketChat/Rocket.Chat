import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../app/callbacks';
import { getUserPreference } from '../../../app/utils';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const isEnabled = getUserPreference(Meteor.userId(), 'highlights')?.some((highlight) => highlight?.trim()) ?? false;

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'highlight-words');
			return;
		}

		const { createHighlightWordsMessageRenderer } = await import('../../../app/highlight-words');

		const renderMessage = createHighlightWordsMessageRenderer({
			wordsToHighlight: getUserPreference(Meteor.userId(), 'highlights')
				.filter((highlight) => highlight?.trim()),
		});

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM + 1, 'highlight-words');
	});
});
