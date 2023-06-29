import { settings, settingsRegistry } from '../../settings/server';
import { Apps } from '../../../ee/server/apps';

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
	settings.watch('Apps_Framework_Source_Package_Storage_Type', (value) => {
		if (!Apps.isInitialized()) {
			Apps.appsSourceStorageType = value;
		} else {
			Apps.getAppSourceStorage()?.setStorage(value as string);
		}
	});

	settings.watch('Apps_Framework_Source_Package_Storage_FileSystem_Path', (value) => {
		if (!Apps.isInitialized()) {
			Apps.appsSourceStorageFilesystemPath = value;
		} else {
			Apps.getAppSourceStorage()?.setFileSystemStoragePath(value as string);
		}
	});

	settings.watch('Apps_Logs_TTL', async (value) => {
		if (!Apps.isInitialized()) {
			return;
		}

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

		const model = Apps._logModel;

		await model?.resetTTLIndex(expireAfterSeconds);
	});
}
