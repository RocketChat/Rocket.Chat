import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { ImporterWebsocketReceiver } from './ImporterWebsocketReceiver';
import { Importers } from '../lib/Importers';
import { ImporterInfo } from '../lib/ImporterInfo';
import { ProgressStep } from '../lib/ImporterProgressStep';

FlowRouter.route('/admin/import', {
	name: 'admin-import',
	async action() {
		await import('./admin/adminImport');
		BlazeLayout.render('main', { center: 'adminImport' });
	},
});

FlowRouter.route('/admin/import/new', {
	name: 'admin-import-new',
	async action() {
		await import('./admin/adminImportNew');
		BlazeLayout.render('main', { center: 'adminImportNew' });
	},
});

FlowRouter.route('/admin/import/prepare', {
	name: 'admin-import-prepare',
	async action() {
		await import('./admin/adminImportPrepare');
		BlazeLayout.render('main', { center: 'adminImportPrepare' });
	},
});

FlowRouter.route('/admin/import/progress', {
	name: 'admin-import-progress',
	async action() {
		await import('./admin/adminImportProgress');
		BlazeLayout.render('main', { center: 'adminImportProgress' });
	},
});

export {
	Importers,
	ImporterInfo,
	ImporterWebsocketReceiver,
	ProgressStep,
};
