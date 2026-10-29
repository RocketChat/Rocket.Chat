import { Meteor } from 'meteor/meteor';

import { createMarkdownMessageRenderer, createMarkdownNotificationRenderer } from '../../../lib/markdown/markdown';
import { callbacks } from '../callbacks';

export { Markdown } from '../../../lib/markdown/markdown';

Meteor.startup(() => {
	const renderMessage = createMarkdownMessageRenderer({ rootUrl: Meteor.absoluteUrl() });
	callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');

	const renderNotification = createMarkdownNotificationRenderer();
	callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
});
