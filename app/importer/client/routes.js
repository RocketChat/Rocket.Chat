import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../ui-admin/client';

registerAdminRoute('/import', {
	name: 'admin-import',
	lazyRouteComponent: () => import('./components/ImportHistoryRoute'),
});

registerAdminRoute('/import/new', {
	name: 'admin-import-new',
	lazyRouteComponent: () => import('./components/NewImportRoute'),
	async action() {
		await import('./admin/adminImportNew');
		BlazeLayout.render('main', { center: 'adminImportNew' });
	},
});

registerAdminRoute('/import/prepare', {
	name: 'admin-import-prepare',
	lazyRouteComponent: () => import('./components/PrepareImportRoute'),
	props: {

	},
	async action() {
		await import('./admin/adminImportPrepare');
		BlazeLayout.render('main', { center: 'adminImportPrepare' });
	},
});

registerAdminRoute('/import/progress', {
	name: 'admin-import-progress',
	lazyRouteComponent: () => import('./components/ImportProgressRoute'),
	props: {

	},
	async action() {
		await import('./admin/adminImportProgress');
		BlazeLayout.render('main', { center: 'adminImportProgress' });
	},
});
