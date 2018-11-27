import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
	const RocketChatStore = RocketChatFile.FileSystem;

	let path = '~/uploads';
	if (RocketChat.settings.get('ImportFile_FileSystemPath') != null) {
		if (RocketChat.settings.get('ImportFile_FileSystemPath').trim() !== '') {
			path = RocketChat.settings.get('ImportFile_FileSystemPath');
		}
	}

	this.RocketChatImportFileInstance = new RocketChatStore({
		name: 'import_files',
		absolutePath: path,
	});
});
