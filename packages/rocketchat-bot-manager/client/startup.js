
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';
import { AdminBox } from 'meteor/rocketchat:ui-utils';

AdminBox.addOption({
	href: 'admin-bots',
	i18nLabel: 'Bots',
	icon: 'hubot',
	permissionGranted: () => hasAtLeastOnePermission(['view-bot-administration']),
});
