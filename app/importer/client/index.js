import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../ui-admin/client';
import { Importers } from '../lib/Importers';
import { ImporterInfo } from '../lib/ImporterInfo';
import { ProgressStep } from '../lib/ImporterProgressStep';
import { ImporterWebsocketReceiver } from './ImporterWebsocketReceiver';

registerAdminRoute('/import', {
	name: 'admin-import',
	async action() {
		await import('./admin/adminImport');
		BlazeLayout.render('main', { center: 'adminImport' });
	},
});

registerAdminRoute('/import/new', {
	name: 'admin-import-new',
	async action() {
		await import('./admin/adminImportNew');
		BlazeLayout.render('main', { center: 'adminImportNew' });
	},
});

registerAdminRoute('/import/prepare', {
	name: 'admin-import-prepare',
	async action() {
		await import('./admin/adminImportPrepare');
		BlazeLayout.render('main', { center: 'adminImportPrepare' });
	},
});

registerAdminRoute('/import/progress', {
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
