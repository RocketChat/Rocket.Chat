import { AdminBox } from 'meteor/rocketchat:ui-utils';
import { hasPermission } from 'meteor/rocketchat:authorization';

AdminBox.addOption({
	href: 'emoji-custom',
	i18nLabel: 'Custom_Emoji',
	icon: 'emoji',
	permissionGranted() {
		return hasPermission('manage-emoji');
	},
});
