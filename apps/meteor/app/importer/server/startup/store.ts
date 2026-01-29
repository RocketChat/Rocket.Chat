import { Meteor } from 'meteor/meteor';

import { RocketChatFile } from '../../../file/server';
import { settings } from '../../../settings/server';

export let RocketChatImportFileInstance: InstanceType<typeof RocketChatFile.FileSystem>;

Meteor.startup(() => {
	const RocketChatStore = RocketChatFile.FileSystem;

	let path = '/tmp/rocketchat-importer';
	if (settings.get<string>('ImportFile_FileSystemPath') != null) {
		const filePath = settings.get<string>('ImportFile_FileSystemPath');
		if (typeof filePath === 'string' && filePath.trim() !== '') {
			path = filePath;
		}
	}

	RocketChatImportFileInstance = new RocketChatStore({
		name: 'import_files',
		absolutePath: path,
	} as any); // FIXME
});
