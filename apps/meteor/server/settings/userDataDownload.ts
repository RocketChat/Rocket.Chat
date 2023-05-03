import { settingsRegistry } from '../../app/settings/server';

export const createUserDataSettings = () =>
	settingsRegistry.addGroup('UserDataDownload', async function () {
		await this.add('UserData_EnableDownload', true, {
			type: 'boolean',
			public: true,
			i18nLabel: 'UserData_EnableDownload',
		});

		await this.add('UserData_FileSystemPath', '', {
			type: 'string',
			public: true,
			i18nLabel: 'UserData_FileSystemPath',
		});

		await this.add('UserData_FileSystemZipPath', '', {
			type: 'string',
			public: true,
			i18nLabel: 'UserData_FileSystemZipPath',
		});

		await this.add('UserData_ProcessingFrequency', 2, {
			type: 'int',
			public: true,
			i18nLabel: 'UserData_ProcessingFrequency',
		});

		await this.add('UserData_MessageLimitPerRequest', 1000, {
			type: 'int',
			public: true,
			i18nLabel: 'UserData_MessageLimitPerRequest',
		});
	});
