import { hasAllPermission } from '../../../authorization';
import { registerAdminSidebarItem } from '../../../../client/views/admin';

registerAdminSidebarItem({
	href: 'admin-oauth-apps',
	i18nLabel: 'OAuth Apps',
	icon: 'discover',
	permissionGranted() {
		return hasAllPermission('manage-oauth-apps');
	},
});
