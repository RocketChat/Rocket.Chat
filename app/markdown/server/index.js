import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings';
import { createMarkdownMessageRenderer, createMarkdownNotificationRenderer } from '../lib/markdown';
import './settings';

export { Markdown } from '../lib/markdown';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const options = {
			parser: settings.get('Markdown_Parser'),
			supportSchemesForLink: settings.get('Markdown_SupportSchemesForLink'),
			headers: settings.get('Markdown_Headers'),
			rootUrl: Meteor.absoluteUrl(),
			marked: {
				gfm: settings.get('Markdown_Marked_GFM'),
				tables: settings.get('Markdown_Marked_Tables'),
				breaks: settings.get('Markdown_Marked_Breaks'),
				pedantic: settings.get('Markdown_Marked_Pedantic'),
				smartLists: settings.get('Markdown_Marked_SmartLists'),
				smartypants: settings.get('Markdown_Marked_Smartypants'),
			},
		};

		const renderMessage = createMarkdownMessageRenderer(options);
		callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');
	});

	const renderNotification = createMarkdownNotificationRenderer({
		supportSchemesForLink: settings.get('Markdown_SupportSchemesForLink'),
	});
	callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
});
