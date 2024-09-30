import { Apps, type AppMetadataStorage } from '@rocket.chat/apps';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 307,
	name: "Mark all installed private apps as 'migrated'",
	async up() {
		if (!Apps.self) {
			throw new Error('Apps Orchestrator not registered.');
		}

		Apps.initialize();
		const appsStorage = Apps.getStorage();
		const apps = await appsStorage.retrieveAllPrivate();

		const promises: Array<ReturnType<AppMetadataStorage['update']>> = [];

		apps.forEach((app) => {
			if (AppStatusUtils.isEnabled(app.status)) {
				promises.push(
					appsStorage.update({
						...app,
						migrated: true,
						installationSource: 'marketplaceInfo' in app ? 'marketplace' : 'private',
					} as IAppStorageItem),
				);
			}
		});

		await Promise.all(promises);
	},
});
