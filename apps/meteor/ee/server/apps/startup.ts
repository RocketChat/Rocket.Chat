import { License } from '@rocket.chat/license';

import { Apps } from './orchestrator';
import { settings, settingsRegistry } from '../../../app/settings/server';
import { disableAppsWithAddonsCallback } from '../lib/apps/disableAppsWithAddonsCallback';

export const startupApp = async function startupApp() {
	await settingsRegistry.addGroup('General', async function () {
		await this.section('Apps', async function () {
			await this.add('Apps_Logs_TTL', '30_days', {
				type: 'select',
				values: [
					{
						key: '7_days',
						i18nLabel: 'Apps_Logs_TTL_7days',
					},
					{
						key: '14_days',
						i18nLabel: 'Apps_Logs_TTL_14days',
					},
					{
						key: '30_days',
						i18nLabel: 'Apps_Logs_TTL_30days',
					},
				],
				public: true,
				hidden: false,
				alert: 'Apps_Logs_TTL_Alert',
			});

			await this.add('Apps_Framework_Source_Package_Storage_Type', 'gridfs', {
				type: 'select',
				values: [
					{
						key: 'gridfs',
						i18nLabel: 'GridFS',
					},
					{
						key: 'filesystem',
						i18nLabel: 'FileSystem',
					},
				],
				public: true,
				hidden: false,
				alert: 'Apps_Framework_Source_Package_Storage_Type_Alert',
			});

			await this.add('Apps_Framework_Source_Package_Storage_FileSystem_Path', '', {
				type: 'string',
				public: true,
				enableQuery: {
					_id: 'Apps_Framework_Source_Package_Storage_Type',
					value: 'filesystem',
				},
				alert: 'Apps_Framework_Source_Package_Storage_FileSystem_Alert',
			});
		});
	});

	async function migratePrivateAppsCallback() {
		void Apps.migratePrivateApps();
		void Apps.disableMarketplaceApps();
	}

	License.onInvalidateLicense(migratePrivateAppsCallback);
	License.onRemoveLicense(migratePrivateAppsCallback);

	// Disable apps that depend on add-ons (external modules) if they are invalidated
	License.onModule(disableAppsWithAddonsCallback);

	Apps.initialize();

	void Apps.load();
	// settings.watch('Apps_Logs_TTL', async (value) => {
	// 	let expireAfterSeconds = 0;

	// 	switch (value) {
	// 		case '7_days':
	// 			expireAfterSeconds = 604800;
	// 			break;
	// 		case '14_days':
	// 			expireAfterSeconds = 1209600;
	// 			break;
	// 		case '30_days':
	// 			expireAfterSeconds = 2592000;
	// 			break;
	// 	}

	// 	if (!expireAfterSeconds) {
	// 		return;
	// 	}

	// 	const model = Apps._logModel;

	// 	await model!.resetTTLIndex(expireAfterSeconds);
	// });

	settings.watch<'filesystem' | 'gridfs'>('Apps_Framework_Source_Package_Storage_Type', (value) =>
		Apps.getAppSourceStorage()!.setStorage(value),
	);

	settings.watch<string>('Apps_Framework_Source_Package_Storage_FileSystem_Path', (value) =>
		Apps.getAppSourceStorage()!.setFileSystemStoragePath(value),
	);
};
