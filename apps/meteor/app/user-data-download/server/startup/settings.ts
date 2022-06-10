import { settingsRegistry } from '../../../settings/server';

settingsRegistry.addGroup('UserDataDownload', function () {
	this.add('UserData_EnableDownload', true, {
		type: 'boolean',
		public: true,
		i18nLabel: 'UserData_EnableDownload',
	});

	this.add('UserData_FileSystemPath', '', {
		type: 'string',
		public: true,
		i18nLabel: 'UserData_FileSystemPath',
	});

	this.add('UserData_FileSystemZipPath', '', {
		type: 'string',
		public: true,
		i18nLabel: 'UserData_FileSystemZipPath',
	});

	this.add('UserData_ProcessingFrequency', 2, {
		type: 'int',
		public: true,
		i18nLabel: 'UserData_ProcessingFrequency',
	});

	this.add('UserData_MessageLimitPerRequest', 1000, {
		type: 'int',
		public: true,
		i18nLabel: 'UserData_MessageLimitPerRequest',
	});
});
