import { hasAtLeastOnePermission } from '../../../authorization';
import { registerAdminSidebarItem } from '../../../ui-admin/client';

registerAdminSidebarItem({
	href: 'custom-sounds',
	i18nLabel: 'Custom_Sounds',
	icon: 'volume',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-sounds']);
	},
});
