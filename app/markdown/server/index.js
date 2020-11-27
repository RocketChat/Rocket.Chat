import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { createMarkdownMessageRenderer, createMarkdownNotificationRenderer } from '../lib/markdown';
import './settings';

export { Markdown } from '../lib/markdown';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const options = {
			parser: settings.get('Markdown_Parser'),
		};

		const renderMessage = createMarkdownMessageRenderer(options);
		callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');
	});

	const renderNotification = createMarkdownNotificationRenderer();
	callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
});
