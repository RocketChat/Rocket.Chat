import { AdminBox } from '../../../ui-admin/client/AdminBox';
import { hasAtLeastOnePermission } from '../../../authorization';

AdminBox.addOption({
	href: 'custom-sounds',
	i18nLabel: 'Custom_Sounds',
	icon: 'volume',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-sounds']);
	},
});
