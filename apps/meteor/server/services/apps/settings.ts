import { settings, settingsRegistry } from '../../settings/server';

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

settings.watch('Apps_Framework_Source_Package_Storage_Type', (value) => {
	if (!Apps.isInitialized()) {
		appsSourceStorageType = value;
	} else {
		Apps.getAppSourceStorage().setStorage(value);
	}
});

settings.watch('Apps_Framework_Source_Package_Storage_FileSystem_Path', (value) => {
	if (!Apps.isInitialized()) {
		appsSourceStorageFilesystemPath = value;
	} else {
		Apps.getAppSourceStorage().setFileSystemStoragePath(value);
	}
});

settings.watch('Apps_Framework_enabled', (isEnabled) => {
	// In case this gets called before `Meteor.startup`
	if (!Apps.isInitialized()) {
		return;
	}

	if (isEnabled) {
		Apps.load();
	} else {
		Apps.unload();
	}
});

settings.watch('Apps_Logs_TTL', (value) => {
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

	model.resetTTLIndex(expireAfterSeconds);
});
