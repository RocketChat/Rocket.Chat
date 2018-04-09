import s from 'underscore.string';

const REGEX = /^\/(.*)\/([gim]*)$/;

//
// IssueLink is a named function that will add issue links
// @param {Object} message - The message object
//

function IssueLink(message) {
	if (s.trim(message.html) && RocketChat.settings.get('IssueLinks_Enabled')) {
		const regexpString = RocketChat.settings.get('IssueLinks_RegExp');
		const match = regexpString.match(REGEX);
		const regexp = match ? new RegExp(match[1], match[2]) : new RegExp(regexpString, 'g');
		message.html = message.html.replace(regexp, function(match, issueNumber) {
			const url = RocketChat.settings.get('IssueLinks_Template').replace('%s', issueNumber.substring(1) === '#' ? issueNumber.substring(1) : issueNumber);
			return match.replace(issueNumber, `<a href="${ url }" target="_blank">${ issueNumber }</a>`);
		});
	}
	return message;
}

RocketChat.callbacks.add('renderMessage', IssueLink, RocketChat.callbacks.priority.MEDIUM);
