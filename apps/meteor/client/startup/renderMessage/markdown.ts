import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings/client';
import { callbacks } from '../../../lib/callbacks';

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

		import('../../../app/markdown/client').then(({ createMarkdownMessageRenderer }) => {
			const renderMessage = createMarkdownMessageRenderer(options);
			callbacks.remove('renderMessage', 'markdown');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');
		});
	});
});
