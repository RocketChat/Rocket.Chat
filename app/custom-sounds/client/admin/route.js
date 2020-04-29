import { registerAdminRoute } from '../../../ui-admin/client';

registerAdminRoute('/custom-sounds/:context?', {
	name: 'custom-sounds',
	lazyRouteComponent: () => import('./AdminSoundsRoute'),
});
