import { AdminBox } from '/app/ui-utils';
import { hasAtLeastOnePermission } from '/app/authorization';

AdminBox.addOption({
	href: 'custom-sounds',
	i18nLabel: 'Custom_Sounds',
	icon: 'volume',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-sounds']);
	},
});
