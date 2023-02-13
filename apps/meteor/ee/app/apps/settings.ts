import type { SettingValue } from '@rocket.chat/core-typings';

import { settings, settingsRegistry } from '../../../app/settings/server';
import type { AppServerOrchestrator } from './orchestrator';

export function addAppsSettings() {
	settingsRegistry.addGroup('General', function () {
		this.section('Apps', function () {
			this.add('Apps_Logs_TTL', '30_days', {
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

			this.add('Apps_Framework_enabled', true, {
				type: 'boolean',
				hidden: false,
			});

			this.add('Apps_Framework_Development_Mode', false, {
				type: 'boolean',
				enableQuery: {
					_id: 'Apps_Framework_enabled',
					value: true,
				},
				public: true,
				hidden: false,
			});

			this.add('Apps_Framework_Source_Package_Storage_Type', 'gridfs', {
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

			this.add('Apps_Framework_Source_Package_Storage_FileSystem_Path', '', {
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

export function watchAppsSettingsChanges(apps: AppServerOrchestrator) {
	settings.watch('Apps_Framework_Source_Package_Storage_Type', (value: SettingValue) => {
		apps.getAppSourceStorage()?.setStorage(value as string);
	});

	settings.watch('Apps_Framework_Source_Package_Storage_FileSystem_Path', (value: SettingValue) => {
		apps.getAppSourceStorage()?.setFileSystemStoragePath(value as string);
	});

	settings.watch('Apps_Framework_enabled', (isEnabled: SettingValue) => {
		if (isEnabled) {
			apps.load();
		} else {
			apps.unload();
		}
	});

	settings.watch('Apps_Logs_TTL', (value: SettingValue) => {
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

		const model = apps._logModel;

		model?.resetTTLIndex(expireAfterSeconds);
	});
}
