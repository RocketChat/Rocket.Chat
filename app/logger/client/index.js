import './logger';

import { hasAllPermission } from '../../authorization';
import { registerAdminRoute, registerAdminSidebarItem } from '../../ui-admin/client';

registerAdminSidebarItem({
	href: 'admin-view-logs',
	i18nLabel: 'View_Logs',
	icon: 'post',
	permissionGranted: () => hasAllPermission('view-logs'),
});

registerAdminRoute('/view-logs', {
	name: 'admin-view-logs',
	lazyRouteComponent: () => import('./components/ViewLogsRoute'),
});
