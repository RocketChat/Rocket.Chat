import _ from 'underscore';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import '../../ufs/Webdav/server';

const get: FileUploadClass['get'] = async function (this: FileUploadClass, file, _req, res) {
	(await this.store.getReadStream(file._id, file))
		.on('error', () => {
			SystemLogger.error('An error ocurred when fetching the file');
			res.writeHead(503);
			res.end();
		})
		.on('data', (chunk) => {
			res.write(chunk);
		})
		.on('end', res.end.bind(res));
};

const copy: FileUploadClass['copy'] = async function (this: FileUploadClass, file, out) {
	return new Promise(async (resolve) => {
		(await this.store.getReadStream(file._id, file)).pipe(out).on('finish', () => resolve());
	});
};

const WebdavUploads = new FileUploadClass({
	name: 'Webdav:Uploads',
	get,
	copy,
	// store setted bellow
});

const WebdavAvatars = new FileUploadClass({
	name: 'Webdav:Avatars',
	get,
	copy,
	// store setted bellow
});

const WebdavUserDataFiles = new FileUploadClass({
	name: 'Webdav:UserDataFiles',
	get,
	copy,
	// store setted bellow
});

const configure = _.debounce(() => {
	const uploadFolderPath = settings.get('FileUpload_Webdav_Upload_Folder_Path');
	const server = settings.get('FileUpload_Webdav_Server_URL');
	const username = settings.get('FileUpload_Webdav_Username');
	const password = settings.get('FileUpload_Webdav_Password');

	if (!server || !username || !password) {
		return;
	}

	const config = {
		connection: {
			credentials: {
				server,
				username,
				password,
			},
		},
		uploadFolderPath,
	};

	WebdavUploads.store = FileUpload.configureUploadsStore('Webdav', WebdavUploads.name, config);
	WebdavAvatars.store = FileUpload.configureUploadsStore('Webdav', WebdavAvatars.name, config);
	WebdavUserDataFiles.store = FileUpload.configureUploadsStore('Webdav', WebdavUserDataFiles.name, config);
}, 500);

settings.watchByRegex(/^FileUpload_Webdav_/, configure);
