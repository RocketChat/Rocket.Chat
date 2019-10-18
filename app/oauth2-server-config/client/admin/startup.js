import { AdminBox } from '../../../ui-utils';
import { hasAllPermission } from '../../../authorization';

AdminBox.addOption({
	href: 'admin-oauth-apps',
	i18nLabel: 'OAuth Apps',
	icon: 'discover',
	permissionGranted() {
		return hasAllPermission('manage-oauth-apps');
	},
});
