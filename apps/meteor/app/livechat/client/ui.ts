import { MessageTypes } from '../../ui-utils/client';

MessageTypes.registerType({
	id: 'livechat-close',
	system: true,
	message: 'Conversation_closed',
	data(message) {
		return {
			comment: message.msg,
		};
	},
});

MessageTypes.registerType({
	id: 'livechat-started',
	system: true,
	message: 'Chat_started',
});
