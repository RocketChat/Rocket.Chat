import s from 'underscore.string';

//
// IssueLink is a named function that will add issue links
// @param {Object} message - The message object
//

const regexpDefault = /(?:^|\s|\n)(#[0-9]+)\b/g;
let regexp = regexpDefault;

Tracker.autorun(function() {
	regexp = regexpDefault;

	if (!RocketChat.settings.get('IssueLinks_Enabled')) {
		return;
	}

	const format = RocketChat.settings.get('IssueLinks_Format');
	if (!format) {
		return;
	}

	try {
		regexp = new RegExp(`(?:^|\\s|\\n)(#${ format })\\b`, 'g');
	} catch (error) {
		console.log(`"${ format }" is a bad format to regexp [rocketchat-issuelinks]`);
	}
});

function IssueLink(message) {
	if (s.trim(message.html) && RocketChat.settings.get('IssueLinks_Enabled')) {
		const template = RocketChat.settings.get('IssueLinks_Template');
		message.html = message.html.replace(regexp, function(match, issueNumber) {
			const url = template.replace('%s', issueNumber.substring(1));
			return match.replace(issueNumber, `<a href="${ url }" target="_blank">${ issueNumber }</a>`);
		});
	}
	return message;
}

RocketChat.callbacks.add('renderMessage', IssueLink, RocketChat.callbacks.priority.MEDIUM, 'issuelink');
