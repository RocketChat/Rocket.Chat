import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { createMarkdownMessageRenderer, createMarkdownNotificationRenderer } from '../../../app/markdown/lib/markdown';
import { callbacks } from '../callbacks';

export { Markdown } from '../../../app/markdown/lib/markdown';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const options = {
			rootUrl: Meteor.absoluteUrl(),
		};

		const renderMessage = createMarkdownMessageRenderer(options);
		callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');
	});

	const renderNotification = createMarkdownNotificationRenderer();
	callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
});
