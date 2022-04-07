import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { getUserPreference } from '../../../app/utils/client';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const highlights: (string | undefined)[] | undefined = getUserPreference(Meteor.userId(), 'highlights');
		const isEnabled = highlights?.some((highlight) => highlight?.trim()) ?? false;

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'highlight-words');
			return;
		}

		const options = {
			wordsToHighlight: (highlights?.filter((highlight) => highlight?.trim()) as string[]) || [],
		};

		import('../../../app/highlight-words').then(({ createHighlightWordsMessageRenderer }) => {
			const renderMessage = createHighlightWordsMessageRenderer(options);
			callbacks.remove('renderMessage', 'highlight-words');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM + 1, 'highlight-words');
		});
	});
});
