import { Meteor } from 'meteor/meteor';
import { RocketChatFile } from 'meteor/rocketchat:file';

export let RocketChatImportFileInstance;

Meteor.startup(function() {
	const RocketChatStore = RocketChatFile.FileSystem;

	let path = '/tmp/rocketchat-importer';
	if (RocketChat.settings.get('ImportFile_FileSystemPath') != null) {
		if (RocketChat.settings.get('ImportFile_FileSystemPath').trim() !== '') {
			path = RocketChat.settings.get('ImportFile_FileSystemPath');
		}
	}

	RocketChatImportFileInstance = new RocketChatStore({
		name: 'import_files',
		absolutePath: path,
	});
});
