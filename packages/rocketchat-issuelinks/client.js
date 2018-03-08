import s from 'underscore.string';

//
// IssueLink is a named function that will add issue links
// @param {Object} message - The message object
//

function IssueLink(message) {
	if (s.trim(message.html) && RocketChat.settings.get('IssueLinks_Enabled')) {
		const regexp = new RegExp(`(?:^|\\s|\\n)(#${ RocketChat.settings.get('IssueLinks_Format') })\\b`, 'g');
		message.html = message.html.replace(regexp, function(match, issueNumber) {
			const url = RocketChat.settings.get('IssueLinks_Template').replace('%s', issueNumber.substring(1));
			return match.replace(issueNumber, `<a href="${ url }" target="_blank">${ issueNumber }</a>`);
		});
	}
	return message;
}

RocketChat.callbacks.add('renderMessage', IssueLink, RocketChat.callbacks.priority.MEDIUM);
