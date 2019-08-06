import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import '../../app/ui-admin/client/adminFlex';

FlowRouter.route('/admin/users', {
	name: 'admin-users',
	async action() {
		await import('../../app/ui-admin/client');
		BlazeLayout.render('main', { center: 'adminUsers' });
	},
});

FlowRouter.route('/admin/rooms', {
	name: 'admin-rooms',
	async action() {
		await import('../../app/ui-admin/client');
		BlazeLayout.render('main', { center: 'adminRooms' });
	},
});

FlowRouter.route('/admin/info', {
	name: 'admin-info',
	async action() {
		await import('../../app/ui-admin/client');
		BlazeLayout.render('main', { center: 'adminInfo' });
	},
});

FlowRouter.route('/admin/import', {
	name: 'admin-import',
	async action() {
		await import('../../app/ui-admin/client');
		BlazeLayout.render('main', { center: 'adminImport' });
	},
});

FlowRouter.route('/admin/import/history', {
	name: 'admin-import-history',
	async action() {
		await import('../../app/ui-admin/client');
		BlazeLayout.render('main', { center: 'adminImportHistory' });
	},
});

FlowRouter.route('/admin/import/prepare/:importer', {
	name: 'admin-import-prepare',
	async action() {
		await import('../../app/ui-admin/client');
		BlazeLayout.render('main', { center: 'adminImportPrepare' });
	},
});

FlowRouter.route('/admin/import/progress/:importer', {
	name: 'admin-import-progress',
	async action() {
		await import('../../app/ui-admin/client');
		BlazeLayout.render('main', { center: 'adminImportProgress' });
	},
});

FlowRouter.route('/admin/:group?', {
	name: 'admin',
	async action() {
		await import('../../app/ui-admin/client');
		BlazeLayout.render('main', { center: 'admin' });
	},
});
