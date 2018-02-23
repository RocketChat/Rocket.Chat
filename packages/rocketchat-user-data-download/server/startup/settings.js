RocketChat.settings.addGroup('UserDataDownload', function() {

	this.add('UserData_EnableDownload', true, {
		type: 'boolean',
		public: true,
		i18nLabel: 'UserData_EnableDownload'
	});

	this.add('UserData_Storage_Type', 'FileSystem', {
		type: 'select',
		public: true,
		values: [{
			key: 'FileSystem',
			i18nLabel: 'FileSystem'
		}],
		i18nLabel: 'FileUpload_Storage_Type'
	});

	this.add('UserData_FileSystemPath', '', {
		type: 'string',
		public: true,
		enableQuery: {
			_id: 'UserData_Storage_Type',
			value: 'FileSystem'
		},
		i18nLabel: 'UserData_FileSystemPath'
	});

	this.add('UserData_FileSystemZipPath', '', {
		type: 'string',
		public: true,
		enableQuery: {
			_id: 'UserData_Storage_Type',
			value: 'FileSystem'
		},
		i18nLabel: 'UserData_FileSystemZipPath'
	});
});
