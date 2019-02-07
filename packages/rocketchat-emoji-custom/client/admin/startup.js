import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.AdminBox.addOption({
	href: 'emoji-custom',
	i18nLabel: 'Custom_Emoji',
	icon: 'emoji',
	permissionGranted() {
		return RocketChat.authz.hasPermission('manage-emoji');
	},
});
