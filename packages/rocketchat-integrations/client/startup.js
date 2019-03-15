import { AdminBox } from 'meteor/rocketchat:ui-utils';
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';

AdminBox.addOption({
	href: 'admin-integrations',
	i18nLabel: 'Integrations',
	icon: 'code',
	permissionGranted: () => hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']),
});
