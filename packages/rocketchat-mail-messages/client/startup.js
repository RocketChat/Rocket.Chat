import { AdminBox } from 'meteor/rocketchat:ui-utils';
import { hasAllPermission } from 'meteor/rocketchat:authorization';

AdminBox.addOption({
	href: 'mailer',
	i18nLabel: 'Mailer',
	icon: 'mail',
	permissionGranted() {
		return hasAllPermission('access-mailer');
	},
});
