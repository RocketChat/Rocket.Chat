import { Settings } from '@rocket.chat/models';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { AppSignatureManager } from '@rocket.chat/apps-engine/server/managers/AppSignatureManager';

import type { AppRealStorage } from '../../../ee/server/apps/storage';
import { addMigration } from '../../lib/migrations';
import { Apps } from '../../../ee/server/apps';

addMigration({
	version: 291,
	name: "Mark all installed apps as 'migrated', add 'installationSource' and 'signature'",
	async up() {
		// remove non-used settings
		await Settings.removeById('Apps_Framework_Development_Mode');
		await Settings.removeById('Apps_Framework_enabled');

		Apps.initialize();

		const sigMan = Apps.getManager()?.getSignatureManager() as AppSignatureManager;
		const appsStorage = Apps.getStorage() as AppRealStorage;

		const apps = await appsStorage.retrieveAll();

		const promises: Array<ReturnType<AppRealStorage['update']>> = [];

		apps.forEach(async (app) =>
			promises.push(
				appsStorage.update({
					...app,
					migrated: true,
					installationSource: 'marketplaceInfo' in app ? 'marketplace' : 'private',
					signature: await sigMan.signApp(app),
				} as IAppStorageItem),
			),
		);

		await Promise.all(promises);
	},
});
