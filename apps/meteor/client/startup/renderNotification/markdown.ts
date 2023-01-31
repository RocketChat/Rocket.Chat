import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	const options = {
		supportSchemesForLink: 'http,https',
	};

	import('../../../app/markdown/client').then(({ createMarkdownNotificationRenderer }) => {
		const renderNotification = createMarkdownNotificationRenderer(options);
		callbacks.remove('renderNotification', 'filter-markdown');
		callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
	});
});
