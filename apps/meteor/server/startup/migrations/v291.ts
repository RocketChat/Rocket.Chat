import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { Settings } from '@rocket.chat/models';

import { Apps } from '../../../ee/server/apps';
import type { AppRealStorage } from '../../../ee/server/apps/storage';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 291,
	name: "Mark all installed apps as 'migrated', add 'installationSource'",
	async up() {
		// remove non-used settings
		await Settings.removeById('Apps_Framework_Development_Mode');
		await Settings.removeById('Apps_Framework_enabled');

		Apps.initialize();

		const appsStorage = Apps.getStorage() as AppRealStorage;

		const apps = await appsStorage.retrieveAll();

		const promises: Array<ReturnType<AppRealStorage['update']>> = [];

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
