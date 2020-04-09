import { hasAllPermission } from '../../authorization';
import { registerAdminSidebarItem } from '../../ui-admin/client';

registerAdminSidebarItem({
	href: 'admin-mailer',
	i18nLabel: 'Mailer',
	icon: 'mail',
	permissionGranted() {
		return hasAllPermission('access-mailer');
	},
});
