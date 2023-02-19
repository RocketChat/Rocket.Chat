import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	import('../../../app/markdown/client').then(({ createMarkdownNotificationRenderer }) => {
		const renderNotification = createMarkdownNotificationRenderer();
		callbacks.remove('renderNotification', 'filter-markdown');
		callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
	});
});
