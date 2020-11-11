import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { hasAllPermission } from '../../authorization';
import { AccountBox, TabBar, MessageTypes } from '../../ui-utils';
import { addAction } from '../../../client/channel/lib/Toolbox';

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
	href: '/omnichannel/current',
	sideNav: 'omnichannelFlex',
	condition: () => settings.get('Livechat_enabled') && hasAllPermission('view-livechat-manager'),
});

addAction('visitor-info', {
	groups: ['live'],
	id: 'visitor-info',
	title: 'Visitor_Info',
	icon: 'info-circled',
	template: 'visitorInfo',
	order: 0,
});

addAction('contact-chat-history', {
	groups: ['live'],
	id: 'contact-chat-history',
	title: 'Contact_Chat_History',
	icon: 'clock',
	template: 'contactChatHistory',
	order: 11,
});

TabBar.addGroup('message-search', ['live']);
TabBar.addGroup('starred-messages', ['live']);
TabBar.addGroup('uploaded-files-list', ['live']);
TabBar.addGroup('push-notifications', ['live']);
TabBar.addGroup('video', ['live']);

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
