import { MessageTypes } from '../../ui-utils/client';

MessageTypes.registerType({
	id: 'livechat-close',
	system: true,
	text: (t) => t('Conversation_closed'),
});

MessageTypes.registerType({
	id: 'livechat-started',
	system: true,
	text: (t) => t('Chat_started'),
});
