import { AdminBox } from '../../../ui-utils';
import { hasAtLeastOnePermission } from '../../../authorization';

AdminBox.addOption({
	href: 'user-status-custom',
	i18nLabel: 'Custom_User_Status',
	icon: 'user',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-user-status']);
	},
});
