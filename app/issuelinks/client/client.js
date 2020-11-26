import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { callbacks } from '../../callbacks';

const createIssueLinksMessageRenderer = ({ template }) => (message) => {
	if (!message.html?.trim()) {
		return message;
	}

	message.html = message.html.replace(/(?:^|\s|\n)(#[0-9]+)\b/g, (match, issueNumber) => {
		const url = template.replace('%s', issueNumber.substring(1));
		return match.replace(issueNumber, `<a href="${ url }" target="_blank">${ issueNumber }</a>`);
	});

	return message;
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('IssueLinks_Enabled');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'issuelink');
			return;
		}

		const renderMessage = createIssueLinksMessageRenderer({
			template: settings.get('IssueLinks_Template'),
		});

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'issuelink');
	});
});
