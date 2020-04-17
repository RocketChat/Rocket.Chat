import { registerAdminRoute } from '../../ui-admin/client';

registerAdminRoute('/import', {
	name: 'admin-import',
	lazyRouteComponent: () => import('./components/ImportRoute'),
	props: { page: 'history' },
});

registerAdminRoute('/import/new/:importerKey?', {
	name: 'admin-import-new',
	lazyRouteComponent: () => import('./components/ImportRoute'),
	props: { page: 'new' },
});

registerAdminRoute('/import/prepare', {
	name: 'admin-import-prepare',
	lazyRouteComponent: () => import('./components/ImportRoute'),
	props: { page: 'prepare' },
});

registerAdminRoute('/import/progress', {
	name: 'admin-import-progress',
	lazyRouteComponent: () => import('./components/ImportRoute'),
	props: { page: 'progress' },
});
