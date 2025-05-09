import { Apps } from '@rocket.chat/apps';
import type { AppSignatureManager } from '@rocket.chat/apps-engine/server/managers/AppSignatureManager';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { License } from '@rocket.chat/license';

import type { AppRealStorage } from '../../../ee/server/apps/storage';
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

		const sigMan = Apps.getManager()?.getSignatureManager() as AppSignatureManager;
		const appsStorage = Apps.getStorage() as AppRealStorage;
		const apps = await appsStorage.retrieveAllPrivate();

		for await (const app of apps.values()) {
			const updatedApp = {
				...app,
				migrated: true,
			} as IAppStorageItem;

			await appsStorage.update({
				...updatedApp,
				signature: await sigMan.signApp(updatedApp),
			});
		}
	},
});
