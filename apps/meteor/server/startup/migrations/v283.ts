import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import { AppRealStorage } from '../../../app/apps/server/storage';
import { AppsModel } from '../../../app/models/server';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 283,
	name: "Mark all installed apps as 'migrated'",
	async up() {
		const appsModel = new AppsModel();
		const appsStorage = new AppRealStorage(appsModel);

		const apps = await appsStorage.retrieveAll();

		const promises: Array<ReturnType<typeof appsStorage.update>> = [];

		apps.forEach((app) => promises.push(appsStorage.update({ ...app, migrated: true } as IAppStorageItem)));

		await Promise.all(promises);
	},
});
