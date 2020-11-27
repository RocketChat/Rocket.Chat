import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	import('../../../app/markdown/client').then(({ createMarkdownNotificationRenderer }) => {
		const renderNotification = createMarkdownNotificationRenderer();
		callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
	});
});
