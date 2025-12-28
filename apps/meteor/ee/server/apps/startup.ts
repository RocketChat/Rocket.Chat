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
				hidden: true,
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
		void Apps.disablePrivateApps();
		void Apps.disableMarketplaceApps();
	}

	License.onInvalidateLicense(migratePrivateAppsCallback);
	License.onRemoveLicense(migratePrivateAppsCallback);

	// Disable apps that depend on add-ons (external modules) if they are invalidated
	License.onModule(disableAppsWithAddonsCallback);

	Apps.initialize();

	void Apps.load();

	settings.change<'filesystem' | 'gridfs'>('Apps_Framework_Source_Package_Storage_Type', (value) =>
		Apps.getAppSourceStorage()?.setStorage(value),
	);

	settings.change<string>('Apps_Framework_Source_Package_Storage_FileSystem_Path', (value) =>
		Apps.getAppSourceStorage()?.setFileSystemStoragePath(value),
	);
};
