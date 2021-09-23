import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { addMigration } from '../../lib/migrations';
import { Apps } from '../../../app/apps/server';

addMigration({
	version: 238,
	up() {
		Apps.initialize();

		const apps = Apps._model.find().fetch();

		for (const app of apps) {
			const zipFile = Buffer.from(app.zip, 'base64');
			Promise.await((Apps._manager as AppManager).update(zipFile, app.permissionsGranted, { loadApp: false }));
			Promise.await(Apps._model.update({ id: app.id }, { $unset: { zip: 1, compiled: 1 } }));
		}
	},
});
