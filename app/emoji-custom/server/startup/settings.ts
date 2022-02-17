import { settingsRegistry } from '../../../settings/server';

settingsRegistry.addGroup('EmojiCustomFilesystem', function () {
	this.add('EmojiUpload_Storage_Type', 'GridFS', {
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

	this.add('EmojiUpload_FileSystemPath', '', {
		type: 'string',
		enableQuery: {
			_id: 'EmojiUpload_Storage_Type',
			value: 'FileSystem',
		},
		i18nLabel: 'FileUpload_FileSystemPath',
	});
});
