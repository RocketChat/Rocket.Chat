import { AdminBox } from '/app/ui-utils';
import { hasAllPermission } from '/app/authorization';

AdminBox.addOption({
	href: 'admin-oauth-apps',
	i18nLabel: 'OAuth Apps',
	icon: 'discover',
	permissionGranted() {
		return hasAllPermission('manage-oauth-apps');
	},
});
