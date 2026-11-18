import { settings } from '../../../settings';
import { RocketChatFile } from '../../media/file';

const RocketChatStore = RocketChatFile.FileSystem;

let path = '/tmp/rocketchat-importer';
if (settings.get('ImportFile_FileSystemPath') != null) {
	if (settings.get('ImportFile_FileSystemPath').trim() !== '') {
		path = settings.get('ImportFile_FileSystemPath');
	}
}

export const RocketChatImportFileInstance = new RocketChatStore({
	name: 'import_files',
	absolutePath: path,
});
