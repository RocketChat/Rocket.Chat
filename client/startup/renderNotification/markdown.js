import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../app/callbacks';
import { settings } from '../../../app/settings';

Meteor.startup(() => {
	const options = {
		supportSchemesForLink: settings.get('Markdown_SupportSchemesForLink'),
	};

	import('../../../app/markdown/client').then(({ createMarkdownNotificationRenderer }) => {
		const renderNotification = createMarkdownNotificationRenderer(options);
		callbacks.remove('renderNotification', 'filter-markdown');
		callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
	});
});
