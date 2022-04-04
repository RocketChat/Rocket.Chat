import AdmZip from 'adm-zip';
import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { addMigration } from '../../lib/migrations';
import { Apps } from '../../../app/apps/server';

function isPreCompilerRemoval(app: any): boolean {
	const fileNames = Object.keys(app.compiled);
	return fileNames.some((file) => file.endsWith('$ts'));
}

function repackageAppZip(app: any): Buffer {
	const zip = new AdmZip();

	const sourceFiles: string[] = [];

	Object.entries(app.compiled).forEach(([key, value]) => {
		const actualFileName = key.endsWith('$ts') ? key.replace(/\$ts$/, '.js') : key;
		sourceFiles.push(actualFileName);
		zip.addFile(actualFileName, Buffer.from(value as string, 'utf8'));
	});

	const zipToRead = new AdmZip(Buffer.from(app.zip, 'base64'));

	zipToRead.getEntries().forEach((entry: any) => {
		if (!sourceFiles.includes(entry.entryName)) {
			zip.addFile(entry.entryName, entry.getData());
		}
	});

	return zip.toBuffer();
}

addMigration({
	version: 238,
	up() {
		Apps.initialize();

		const apps = Apps._model?.find().fetch();

		for (const app of apps) {
			const zipFile = isPreCompilerRemoval(app) ? repackageAppZip(app) : Buffer.from(app.zip, 'base64');
			Promise.await((Apps._manager as AppManager).update(zipFile, app.permissionsGranted, { loadApp: false }));
			Promise.await(Apps._model?.update({ id: app.id }, { $unset: { zip: 1, compiled: 1 } }));
		}
	},
});
