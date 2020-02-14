import { AdminBox } from '../../../ui-utils';
import { hasAtLeastOnePermission } from '../../../authorization';

AdminBox.addOption({
	href: 'custom-sounds',
	i18nLabel: 'Custom_Sounds',
	icon: 'volume',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-sounds']);
	},
});
