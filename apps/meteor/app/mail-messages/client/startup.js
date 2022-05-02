import { hasAllPermission } from '../../authorization';
import { registerAdminSidebarItem } from '../../../client/views/admin';

registerAdminSidebarItem({
	href: 'admin-mailer',
	i18nLabel: 'Mailer',
	icon: 'mail',
	permissionGranted: () => hasAllPermission('access-mailer'),
});
