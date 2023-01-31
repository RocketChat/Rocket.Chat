import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const options = {
			rootUrl: Meteor.absoluteUrl(),
		};

		import('../../../app/markdown/client').then(({ createMarkdownMessageRenderer }) => {
			const renderMessage = createMarkdownMessageRenderer(options);
			callbacks.remove('renderMessage', 'markdown');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');
		});
	});
});
