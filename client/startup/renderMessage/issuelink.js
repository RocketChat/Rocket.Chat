import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const isEnabled = settings.get('IssueLinks_Enabled');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'issuelink');
			return;
		}

		const { createIssueLinksMessageRenderer } = await import('../../../app/issuelinks/client');

		const renderMessage = createIssueLinksMessageRenderer({
			template: settings.get('IssueLinks_Template'),
		});

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'issuelink');
	});
});
