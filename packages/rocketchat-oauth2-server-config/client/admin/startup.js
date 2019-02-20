import { AdminBox } from 'meteor/rocketchat:ui-utils';
import { hasAllPermission } from 'meteor/rocketchat:authorization';

AdminBox.addOption({
	href: 'admin-oauth-apps',
	i18nLabel: 'OAuth Apps',
	icon: 'discover',
	permissionGranted() {
		return hasAllPermission('manage-oauth-apps');
	},
});
