import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../ui-admin/client';

registerAdminRoute('/import', {
	name: 'admin-import',
	lazyRouteComponent: () => import('./components/ImportHistoryRoute'),
});

registerAdminRoute('/import/new', {
	name: 'admin-import-new',
	lazyRouteComponent: () => import('./components/NewImportRoute'),
});

registerAdminRoute('/import/prepare', {
	name: 'admin-import-prepare',
	lazyRouteComponent: () => import('./components/PrepareImportRoute'),
	async action() {
		await import('./admin/adminImportPrepare');
		BlazeLayout.render('main', { center: 'adminImportPrepare' });
	},
});

registerAdminRoute('/import/progress', {
	name: 'admin-import-progress',
	lazyRouteComponent: () => import('./components/ImportProgressRoute'),
	async action() {
		await import('./admin/adminImportProgress');
		BlazeLayout.render('main', { center: 'adminImportProgress' });
	},
});
