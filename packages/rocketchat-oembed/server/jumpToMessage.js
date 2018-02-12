/* globals getAvatarUrlFromUsername */
import _ from 'underscore';
import URL from 'url';
import QueryString from 'querystring';

const recursiveRemove = (message, deep = 1) => {
	if (message) {
		if ('attachments' in message && deep < RocketChat.settings.get('Message_QuoteChainLimit')) {
			message.attachments.map((msg) => recursiveRemove(msg, deep + 1));
		} else {
			delete(message.attachments);
		}
	}
	return message;
};

RocketChat.callbacks.add('beforeSaveMessage', (msg) => {
	if (msg && msg.urls) {
		msg.urls.forEach((item) => {
			if (item.url.indexOf(Meteor.absoluteUrl()) === 0) {
				const urlObj = URL.parse(item.url);
				if (urlObj.query) {
					const queryString = QueryString.parse(urlObj.query);
					if (_.isString(queryString.msg)) { // Jump-to query param
						const jumpToMessage = recursiveRemove(RocketChat.models.Messages.findOneById(queryString.msg));
						if (jumpToMessage) {
							msg.attachments = msg.attachments || [];
							msg.attachments.push({
								'text' : jumpToMessage.msg,
								'translations': jumpToMessage.translations,
								'author_name' : jumpToMessage.alias || jumpToMessage.u.username,
								'author_icon' : getAvatarUrlFromUsername(jumpToMessage.u.username),
								'message_link' : item.url,
								'attachments' : jumpToMessage.attachments || [],
								'ts': jumpToMessage.ts
							});
							item.ignoreParse = true;
						}
					}
				}
			}
		});
	}
	return msg;
}, RocketChat.callbacks.priority.LOW, 'jumpToMessage');
