import { Apps } from '@rocket.chat/apps';
import type { AppSignatureManager } from '@rocket.chat/apps-engine/server/managers/AppSignatureManager';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import type { AppRealStorage } from '../../../ee/server/apps/storage';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 294,
	async up() {
		if (!Apps.self) {
			throw new Error('Apps Orchestrator not registered.');
		}

		Apps.initialize();

		const sigMan = Apps.getManager()?.getSignatureManager() as AppSignatureManager;
		const appsStorage = Apps.getStorage() as AppRealStorage;

		const apps = await appsStorage.retrieveAll();

		for await (const app of apps.values()) {
			if (app.installationSource && app.signature) {
				continue;
			}

			const updatedApp = {
				...app,
				migrated: true,
				installationSource: 'marketplaceInfo' in app ? 'marketplace' : 'private',
			} as IAppStorageItem;

			await appsStorage.update({
				...updatedApp,
				signature: await sigMan.signApp(updatedApp),
			});
		}
	},
});
