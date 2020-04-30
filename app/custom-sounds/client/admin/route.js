import { registerAdminRoute } from '../../../../client/admin';

registerAdminRoute('/custom-sounds/:context?/:id?', {
	name: 'custom-sounds',
	lazyRouteComponent: () => import('./AdminSoundsRoute'),
});
