import { Meteor } from 'meteor/meteor';

import { RocketChatFile } from '../../../file';
import { settings } from '../../../settings';

export let RocketChatImportFileInstance;

Meteor.startup(function () {
	const RocketChatStore = RocketChatFile.FileSystem;

	let path = '/tmp/rocketchat-importer';
	if (settings.get('ImportFile_FileSystemPath') != null) {
		if (settings.get('ImportFile_FileSystemPath').trim() !== '') {
			path = settings.get('ImportFile_FileSystemPath');
		}
	}

	RocketChatImportFileInstance = new RocketChatStore({
		name: 'import_files',
		absolutePath: path,
	});
});
