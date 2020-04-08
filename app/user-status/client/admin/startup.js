import { AdminBox } from '../../../ui-admin/client/AdminBox';
import { hasAtLeastOnePermission } from '../../../authorization';

AdminBox.addOption({
	href: 'user-status-custom',
	i18nLabel: 'Custom_User_Status',
	icon: 'user',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-user-status']);
	},
});
