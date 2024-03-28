import { Apps, type AppMetadataStorage } from '@rocket.chat/apps';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 291,
	name: "Mark all installed apps as 'migrated', add 'installationSource'",
	async up() {
		// remove non-used settings
		await Settings.removeById('Apps_Framework_Development_Mode');
		await Settings.removeById('Apps_Framework_enabled');

		if (!Apps) {
			throw new Error('Apps Orchestrator not registered.');
		}

		Apps.initialize();

		const appsStorage = Apps.getStorage();

		const apps = await appsStorage.retrieveAll();

		const promises: Array<ReturnType<AppMetadataStorage['update']>> = [];

		apps.forEach((app) =>
			promises.push(
				appsStorage.update({
					...app,
					migrated: true,
					installationSource: 'marketplaceInfo' in app ? 'marketplace' : 'private',
				} as IAppStorageItem),
			),
		);

		await Promise.all(promises);
	},
});
