import { AdminBox } from '../../ui-utils';
import { hasAtLeastOnePermission } from '../../authorization';

AdminBox.addOption({
	icon: 'discover',
	href: 'admin/serviceaccount',
	i18nLabel: 'Service_account_dashboard',
	permissionGranted() {
		return hasAtLeastOnePermission(['view-sa-request']);
	},
});
