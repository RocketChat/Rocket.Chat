/*
 * Mentions is a named function that will process Mentions
 * @param {Object} message - The message object
 */

function MentionsClient(message) {
	let msg = (message && message.html) || '';
	if (!msg.trim()) {
		return message;
	}
	const msgMentionRegex = new RegExp(`(?:^|\\s|\\n)(@(${ RocketChat.settings.get('UTF8_Names_Validation') }):?)[:.,\s]?`, 'g');

	let me = Meteor.user();
	me = me ? me.username : null;

	msg = msg.replace(msgMentionRegex, function(match, mention, username) {
		if (['all', 'here'].includes(username)) {
			return match.replace(mention, `<a class="mention-link mention-link-me mention-link-all background-attention-color">${ mention }</a>`);
		}
		const mentionObj = _.findWhere(message.mentions, {username});
		if (message.temp == null && mentionObj == null) {
			return match;
		}
		const name = RocketChat.settings.get('UI_Use_Real_Name') && mentionObj && mentionObj.name;
		return match.replace(mention, `<a class="mention-link ${ username === me ? 'mention-link-me background-primary-action-color':'' }" data-username="${ username }" title="${ name ? username : '' }">${ name || mention }</a>`);
	});

	const msgChannelRegex = new RegExp(`(?:^|\\s|\\n)(#(${ RocketChat.settings.get('UTF8_Names_Validation') }))[:.,\s]?`, 'g');

	msg = msg.replace(msgChannelRegex, function(match, mention, name) {
		if (message.temp == null && _.findWhere(message.channels, {name}) == null) {
			return match;
		}
		return match.replace(mention, `<a class="mention-link" data-channel="${ name }">${ mention }</a>`);
	});
	message.html = msg;
	return message;
}


RocketChat.callbacks.add('renderMessage', MentionsClient, RocketChat.callbacks.priority.MEDIUM, 'mentions-message');

RocketChat.callbacks.add('renderMentions', MentionsClient, RocketChat.callbacks.priority.MEDIUM, 'mentions-mentions');
