import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { ImporterWebsocketReceiver } from './ImporterWebsocketReceiver';
import { Importers } from '../lib/Importers';
import { ImporterInfo } from '../lib/ImporterInfo';
import { ProgressStep } from '../lib/ImporterProgressStep';


FlowRouter.route('/admin/import', {
	name: 'admin-import',
	async action() {
		await import('./admin/views');
		BlazeLayout.render('main', { center: 'adminImport' });
	},
});

FlowRouter.route('/admin/import/history', {
	name: 'admin-import-history',
	async action() {
		await import('./admin/views');
		BlazeLayout.render('main', { center: 'adminImportHistory' });
	},
});

FlowRouter.route('/admin/import/prepare/:importer', {
	name: 'admin-import-prepare',
	async action() {
		await import('./admin/views');
		BlazeLayout.render('main', { center: 'adminImportPrepare' });
	},
});

FlowRouter.route('/admin/import/progress/:importer', {
	name: 'admin-import-progress',
	async action() {
		await import('./admin/views');
		BlazeLayout.render('main', { center: 'adminImportProgress' });
	},
});

export {
	Importers,
	ImporterInfo,
	ImporterWebsocketReceiver,
	ProgressStep,
};
