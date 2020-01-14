import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { hasAllPermission } from '../../authorization';
import { AccountBox, TabBar, MessageTypes } from '../../ui-utils';

Tracker.autorun((c) => {
	// import omnichannel tabbar templates right away if omnichannel enabled
	if (!settings.get('Livechat_enabled')) {
		return;
	}
	import('./views/regular');
	c.stop();
});

AccountBox.addItem({
	name: 'Omnichannel',
	icon: 'omnichannel',
	href: 'omnichannel-current-chats',
	sideNav: 'omnichannelFlex',
	condition: () => settings.get('Livechat_enabled') && hasAllPermission('view-livechat-manager'),
});

TabBar.addButton({
	groups: ['omnichannel'],
	id: 'visitor-info',
	i18nTitle: 'Visitor_Info',
	icon: 'info-circled',
	template: 'visitorInfo',
	order: 0,
});

TabBar.addButton({
	groups: ['omnichannel'],
	id: 'visitor-history',
	i18nTitle: 'Past_Chats',
	icon: 'chat',
	template: 'visitorHistory',
	order: 11,
});

TabBar.addGroup('message-search', ['omnichannel']);
TabBar.addGroup('starred-messages', ['omnichannel']);
TabBar.addGroup('uploaded-files-list', ['omnichannel']);
TabBar.addGroup('push-notifications', ['omnichannel']);
TabBar.addGroup('video', ['omnichannel']);

TabBar.addButton({
	groups: ['omnichannel'],
	id: 'external-search',
	i18nTitle: 'Knowledge_Base',
	icon: 'book',
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
