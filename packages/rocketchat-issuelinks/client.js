import s from 'underscore.string';

//
// IssueLink is a named function that will add issue links
// @param {Object} message - The message object
//

function IssueLink(message) {
	if (s.trim(message.html) && RocketChat.settings.get('IssueLinks_Enabled')) {
		message.html = message.html.replace(/(?:^|\s|\n)(#[0-9]+)\b/g, function(match, issueNumber) {
			const url = RocketChat.settings.get('IssueLinks_Template').replace('%s', issueNumber.substring(1));
			return match.replace(issueNumber, `<a href="${ url }" target="_blank">${ issueNumber }</a>`);
		});
	}
	return message;
}

RocketChat.callbacks.add('renderMessage', IssueLink, RocketChat.callbacks.priority.MEDIUM);
