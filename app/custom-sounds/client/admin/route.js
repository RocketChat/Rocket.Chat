import { registerAdminRoute } from '../../../../client/admin';

registerAdminRoute('/custom-sounds/:context?', {
	name: 'custom-sounds',
	lazyRouteComponent: () => import('./AdminSoundsRoute'),
});
