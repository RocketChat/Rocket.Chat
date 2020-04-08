import { AdminBox } from '../../../ui-admin/client/AdminBox';
import { hasAllPermission } from '../../../authorization';

AdminBox.addOption({
	href: 'admin-oauth-apps',
	i18nLabel: 'OAuth Apps',
	icon: 'discover',
	permissionGranted() {
		return hasAllPermission('manage-oauth-apps');
	},
});
