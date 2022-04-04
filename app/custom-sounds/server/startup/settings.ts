import { settingsRegistry } from '../../../settings/server';

settingsRegistry.addGroup('CustomSoundsFilesystem', function () {
	this.add('CustomSounds_Storage_Type', 'GridFS', {
		type: 'select',
		values: [
			{
				key: 'GridFS',
				i18nLabel: 'GridFS',
			},
			{
				key: 'FileSystem',
				i18nLabel: 'FileSystem',
			},
		],
		i18nLabel: 'FileUpload_Storage_Type',
	});

	this.add('CustomSounds_FileSystemPath', '', {
		type: 'string',
		enableQuery: {
			_id: 'CustomSounds_Storage_Type',
			value: 'FileSystem',
		},
		i18nLabel: 'FileUpload_FileSystemPath',
	});
});
