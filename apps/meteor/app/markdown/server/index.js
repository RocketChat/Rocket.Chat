import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';
import { createMarkdownMessageRenderer, createMarkdownNotificationRenderer } from '../lib/markdown';

export { Markdown } from '../lib/markdown';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const options = {
			rootUrl: Meteor.absoluteUrl(),
		};

		const renderMessage = createMarkdownMessageRenderer(options);
		callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');
	});

	const renderNotification = createMarkdownNotificationRenderer({
		supportSchemesForLink: settings.get('Markdown_SupportSchemesForLink'),
	});
	callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
});
