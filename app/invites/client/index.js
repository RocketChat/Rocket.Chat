import { registerAdminRoute, registerAdminSidebarItem } from '../../ui-admin/client';
import { hasPermission } from '../../authorization/client';

registerAdminSidebarItem({
	href: 'invites',
	i18nLabel: 'Invites',
	icon: 'user-plus',
	permissionGranted: () => hasPermission('create-invite-links'),
});

registerAdminRoute('/invites', {
	name: 'invites',
	lazyRouteComponent: () => import('./components/InvitesRoute'),
});
