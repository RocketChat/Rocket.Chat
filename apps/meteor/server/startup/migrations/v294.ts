import { getOrchestrator } from '@rocket.chat/apps';
import type { IAppStorageItem } from '@rocket.chat/apps/dist/server/storage/IAppStorageItem';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 294,
	async up() {
		const orchestrator = getOrchestrator();
		if (!orchestrator) {
			throw new Error('Apps Orchestrator not registered.');
		}

		orchestrator.initialize();

		const sigMan = orchestrator.getManager().getSignatureManager();
		const appsStorage = orchestrator.getStorage();

		const apps = await appsStorage.retrieveAll();

		for (const app of apps.values()) {
			if (app.installationSource && app.signature) {
				continue;
			}

			const updatedApp = {
				...app,
				migrated: true,
				installationSource: 'marketplaceInfo' in app ? 'marketplace' : 'private',
			} as IAppStorageItem;

			await appsStorage.updatePartialAndReturnDocument({
				...updatedApp,
				signature: await sigMan.signApp(updatedApp),
			});
		}
	},
});
