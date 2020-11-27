import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../app/callbacks';
import { settings } from '../../../app/settings';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const options = {
			parser: settings.get('Markdown_Parser'),
		};

		import('../../../app/markdown/client').then(({ createMarkdownMessageRenderer }) => {
			const renderMessage = createMarkdownMessageRenderer(options);
			callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');
		});
	});
});
