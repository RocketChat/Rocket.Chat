import type { AppSignatureManager } from '@rocket.chat/apps-engine/server/managers/AppSignatureManager';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import { Apps } from '../../../app/apps/server';
import type { AppRealStorage } from '../../../app/apps/server/storage';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 292,
	name: 'Add checksum signature to existing apps',
	async up() {
		Apps.initialize();

		const sigMan = Apps.getManager()?.getSignatureManager() as AppSignatureManager;
		const appsStorage = Apps.getStorage() as AppRealStorage;

		const apps = await appsStorage.retrieveAll();

		const promises: Array<ReturnType<AppRealStorage['update']>> = [];

		apps.forEach(async (app) =>
			promises.push(
				appsStorage.update({
					...app,
					signature: await sigMan.signApp(app),
				} as IAppStorageItem),
			),
		);

		await Promise.all(promises);
	},
});
