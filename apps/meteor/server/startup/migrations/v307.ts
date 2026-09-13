import { getOrchestrator } from '@rocket.chat/apps';
import type { IAppStorageItem } from '@rocket.chat/apps/dist/server/storage/IAppStorageItem';
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

		const orchestrator = getOrchestrator();
		if (!orchestrator) {
			throw new Error('Apps Orchestrator not registered.');
		}

		orchestrator.initialize();

		const sigMan = orchestrator.getManager().getSignatureManager();
		const appsStorage = orchestrator.getStorage();
		const apps = await appsStorage.retrieveAllPrivate();

		for (const app of apps.values()) {
			const updatedApp = {
				...app,
				migrated: true,
			} as IAppStorageItem;

			await appsStorage.updatePartialAndReturnDocument({
				...updatedApp,
				signature: await sigMan.signApp(updatedApp),
			});
		}
	},
});
