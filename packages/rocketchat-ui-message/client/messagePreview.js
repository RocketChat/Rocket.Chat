/* globals renderMessageBody */

import moment from 'moment';

Template.messagePreview.helpers({
	time() {
		return moment(this.ts).format(RocketChat.settings.get('Message_TimeFormat'));
	},

	date() {
		return moment(this.ts).format(RocketChat.settings.get('Message_DateFormat'));
	},

	body() {
		return Template.instance().body;
	},

	hasOembed() {
		if (!(this.urls && this.urls.length > 0) || !Template.oembedBaseWidget || !RocketChat.settings.get('API_Embed')) {
			return false;
		}

		if ((RocketChat.settings.get('API_EmbedDisabledFor')||'').split(',').map(username => username.trim()).includes(this.u && this.u.username)) {
			return false;
		}

		return true;
	},

	injectIndex(data, index) {
		data.index = index;
	}
});

Template.messagePreview.onCreated(function() {
	let message = this.data;

	return this.body = (() => {
		const isSystemMessage = RocketChat.MessageTypes.isSystemMessage(message);
		const messageType = RocketChat.MessageTypes.getType(message)||{};

		if (messageType.render) {
			message = messageType.render(message);
		} else if (messageType.message) {
			if (typeof messageType.data === 'function' && messageType.data(message)) {
				message = TAPi18n.__(messageType.message, messageType.data(message));
			} else {
				message = TAPi18n.__(messageType.message);
			}
		} else if (message.u && message.u.username === RocketChat.settings.get('Chatops_Username')) {
			message.html = message.msg;
			message = RocketChat.callbacks.run('renderMentions', message);
			message = message.html;
		} else {
			message = renderMessageBody(message);
		}

		if (isSystemMessage) {
			message.html = RocketChat.Markdown.parse(message.html);
		}

		return message;
	})();
});
