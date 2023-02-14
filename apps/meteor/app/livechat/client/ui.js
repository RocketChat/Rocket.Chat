import { settings } from '../../settings';
import { hasAllPermission } from '../../authorization';
import { AccountBox, MessageTypes } from '../../ui-utils';

AccountBox.addItem({
	name: 'Omnichannel',
	icon: 'headset',
	href: '/omnichannel/current',
	sideNav: 'omnichannelFlex',
	condition: () => settings.get('Livechat_enabled') && hasAllPermission('view-livechat-manager'),
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

MessageTypes.registerType({
	id: 'livechat-started',
	system: true,
	message: 'Chat_started',
});
