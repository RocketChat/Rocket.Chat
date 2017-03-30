/*
* Mentions is a named function that will process Mentions
* @param {Object} message - The message object
*/
import _ from 'underscore';
export default (RocketChat) => {
	const RegExps = {
		get msgMentionRegex() {
			return new RegExp(`(?:^|\\s|\\n)(@(${ RocketChat.settings.get('UTF8_Names_Validation') }):?)[:.,\s]?`, 'g');
		},
		get msgChannelRegex() {
			return new RegExp(`(?:^|\\s|\\n)(#(${ RocketChat.settings.get('UTF8_Names_Validation') }))[:.,\s]?`, 'g');
		}
	};

	function replaceUsers(match, mention, username, message, me) {
		if (['all', 'here'].includes(username)) {
			return match.replace(mention, `<a class="mention-link mention-link-me mention-link-all background-attention-color">${ mention }</a>`);
		}
		if (message.temp == null && _.findWhere(message.mentions, {username}) == null) {
			return match;
		}
		return match.replace(mention, `<a class="mention-link ${ username === me ? 'mention-link-me background-primary-action-color':'' }" data-username="${ username }">${ mention }</a>`);
	}

	function replaceChannels(match, mention, name, message) {
		if (message.temp == null && _.findWhere(message.channels, {name}) == null) {
			return match;
		}
		return match.replace(mention, `<a class="mention-link" data-channel="${ name }">${ mention }</a>`);
	}

	function MentionsClient(message) {
		let msg = (message && message.html) || '';
		console.log(123);
		if (!msg.trim()) {
			return message;
		}
		let me = Meteor.user();
		me = me ? me.username : null;
		msg = msg.replace(RegExps.msgMentionRegex, (match, mention, username) => replaceUsers.apply(this, [match, mention, username, message, me]));
		msg = msg.replace(RegExps.msgChannelRegex, (match, mention, name) => replaceChannels.apply(this, [match, mention, name, message]));
		message.html = msg;
		return message;
	}
	return {MentionsClient, msgMentionRegex: RegExps.msgMentionRegex, msgChannelRegex: RegExps.msgChannelRegex, replaceUsers, replaceChannels};
};
