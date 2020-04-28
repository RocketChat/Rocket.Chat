import { registerAdminRoute } from '../../../ui-admin/client';

registerAdminRoute('/custom-sounds', {
	name: 'custom-sounds',
	lazyRouteComponent: () => import('./AdminSoundsRoute'),
});
