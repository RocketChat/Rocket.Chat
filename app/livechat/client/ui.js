import { settings } from '../../settings';
import { hasAllPermission } from '../../authorization';
import { AccountBox, TabBar, MessageTypes } from '../../ui-utils';

AccountBox.addItem({
	name: 'Livechat',
	icon: 'livechat',
	href: 'livechat-current-chats',
	sideNav: 'livechatFlex',
	condition: () => settings.get('Livechat_enabled') && hasAllPermission('view-livechat-manager'),
});

TabBar.addButton({
	groups: ['live'],
	id: 'visitor-info',
	i18nTitle: 'Visitor_Info',
	icon: 'info-circled',
	template: 'visitorInfo',
	order: 0,
});

TabBar.addButton({
	groups: ['live'],
	id: 'visitor-history',
	i18nTitle: 'Past_Chats',
	icon: 'chat',
	template: 'visitorHistory',
	order: 11,
});

TabBar.addGroup('message-search', ['live']);
TabBar.addGroup('starred-messages', ['live']);
TabBar.addGroup('uploaded-files-list', ['live']);
TabBar.addGroup('push-notifications', ['live']);
TabBar.addGroup('video', ['live']);

TabBar.addButton({
	groups: ['live'],
	id: 'external-search',
	i18nTitle: 'Knowledge_Base',
	icon: 'lightbulb',
	template: 'externalSearch',
	order: 10,
});

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
