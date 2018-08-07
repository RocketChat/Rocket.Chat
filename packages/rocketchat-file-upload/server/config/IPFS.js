/* globals FileUpload */

import _ from 'underscore';
import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/IPFS/server.js';

const get = function(file, req, res) {
    // console.log("Get"+file);
	// this.store.getReadStream(file._id, file).pipe(res);
};

const copy = function(file, out) {
	// this.store.getReadStream(file._id, file).pipe(out);
};

const IPFSUploads = new FileUploadClass({
	name: 'IPFS:Uploads',
	get,
	copy
	// store setted bellow
});

// const WebdavAvatars = new FileUploadClass({
// 	name: 'Webdav:Avatars',
// 	get,
// 	copy
// 	// store setted bellow
// });

const IPFSUserDataFiles = new FileUploadClass({
	name: 'IPFS:UserDataFiles',
	get,
	copy
	// store setted bellow
});

const configure = _.debounce(function() {
	const uploadFolderPath = RocketChat.settings.get('FileUpload_IPFS_Upload_Folder_Path');
	const server = RocketChat.settings.get('FileUpload_IPFS_Provider');
	// const username = RocketChat.settings.get('FileUpload_Webdav_Username');
	const password = RocketChat.settings.get('FileUpload_IPFS_Password');
	console.log(password);
	if (!server || !password) {
		return;
	}

	const config = {
		connection: {
			credentials: {
				server,
				password
			}
		},
		uploadFolderPath
	};

	IPFSUploads.store = FileUpload.configureUploadsStore('IPFS', IPFSUploads.name, config);
	// WebdavAvatars.store = FileUpload.configureUploadsStore('Webdav', WebdavAvatars.name, config);
	IPFSUserDataFiles.store = FileUpload.configureUploadsStore('IPFS', IPFSUserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_IPFS_/, configure);
