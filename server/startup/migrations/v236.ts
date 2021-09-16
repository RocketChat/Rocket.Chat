import { Migrations } from '../../../app/migrations';
import { Apps } from '../../../app/apps/server';

Migrations.add({
	version: 236,
	up() {
		Apps.initialize();

		const apps = Apps._model.find().fetch();

		for (const app of apps) {
			const zipFile = Buffer.from(app.zip, 'base64');
			Promise.await(Apps._manager.update(zipFile, app.permissionsGranted, { loadApp: false }));
			Promise.await(Apps._model.update({ id: app.id }, { $unset: { zip: 1, compiled: 1 } }));
		}
	},
});
