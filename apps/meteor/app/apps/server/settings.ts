import type { SettingValue } from '@rocket.chat/core-typings';
import { AppsLogs } from '@rocket.chat/models';
import { Apps } from '@rocket.chat/core-services';

import { settings, settingsRegistry } from '../../settings/server';

export function addAppsSettings() {
	void settingsRegistry.addGroup('General', async function () {
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
}

export function watchAppsSettingsChanges() {
	settings.watch('Apps_Framework_Source_Package_Storage_Type', async (value: SettingValue) => {
		await Apps.setStorage(value as string);
	});

	settings.watch('Apps_Framework_Source_Package_Storage_FileSystem_Path', async (value: SettingValue) => {
		await Apps.setFileSystemStoragePath(value as string);
	});

	settings.watch('Apps_Logs_TTL', async (value: SettingValue) => {
		let expireAfterSeconds = 0;

		switch (value) {
			case '7_days':
				expireAfterSeconds = 604800;
				break;
			case '14_days':
				expireAfterSeconds = 1209600;
				break;
			case '30_days':
				expireAfterSeconds = 2592000;
				break;
		}

		if (!expireAfterSeconds) {
			return;
		}

		await AppsLogs.resetTTLIndex(expireAfterSeconds);
	});
}
