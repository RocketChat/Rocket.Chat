import s from 'underscore.string';

RocketChat.Message = {
	parse(msg, language) {
		const messageType = RocketChat.MessageTypes.getType(msg);
		if (messageType) {
			if (messageType.render) {
				return messageType.render(msg);
			} else if (messageType.template) {
				// Render message
				return;
			} else if (messageType.message) {
				if (!language && typeof localStorage !== 'undefined') {
					language = localStorage.getItem('userLanguage');
				}
				const data = (typeof messageType.data === 'function' && messageType.data(msg)) || {};
				return TAPi18n.__(messageType.message, data, language);
			}
		}
		if (msg.u && msg.u.username === RocketChat.settings.get('Chatops_Username')) {
			msg.html = msg.msg;
			return msg.html;
		}
		msg.html = msg.msg;
		if (s.trim(msg.html) !== '') {
			msg.html = s.escapeHTML(msg.html);
		}
		msg.html = msg.html.replace(/\n/gm, '<br/>');
		return msg.html;
	}
};
