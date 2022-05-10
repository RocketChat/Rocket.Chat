import { hasAtLeastOnePermission } from '../../authorization';
import { registerAdminSidebarItem } from '../../../client/views/admin';

registerAdminSidebarItem({
	href: 'admin-integrations',
	i18nLabel: 'Integrations',
	icon: 'code',
	permissionGranted: () =>
		hasAtLeastOnePermission([
			'manage-outgoing-integrations',
			'manage-own-outgoing-integrations',
			'manage-incoming-integrations',
			'manage-own-incoming-integrations',
		]),
});
