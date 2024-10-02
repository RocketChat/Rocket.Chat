import { Apps, type AppMetadataStorage } from '@rocket.chat/apps';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { License } from '@rocket.chat/license';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 307,
	name: "Mark all installed private apps as 'migrated'",
	async up() {
		const isEE = License.hasValidLicense();
		if (isEE) {
			return;
		}

		if (!Apps.self) {
			throw new Error('Apps Orchestrator not registered.');
		}

		Apps.initialize();
		const appsStorage = Apps.getStorage();
		const apps = await appsStorage.retrieveAllPrivate();

		const promises: Array<ReturnType<AppMetadataStorage['update']>> = [];

		apps.forEach((app) => {
			promises.push(
				appsStorage.update({
					...app,
					migrated: true,
					installationSource: 'marketplaceInfo' in app ? 'marketplace' : 'private',
				} as IAppStorageItem),
			);
		});

		await Promise.all(promises);
	},
});
