/* globals FileUpload */

import _ from 'underscore';
import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/GoogleStorage/server.js';


const get = function(file, req, res) {
	this.store.getRedirectURL(file, (err, fileUrl) => {
		if (err) {
			console.error(err);
		}

		if (fileUrl) {
			res.setHeader('Location', fileUrl);
			res.writeHead(302);
		}
		res.end();
	});
};

const GoogleCloudStorageUploads = new FileUploadClass({
	name: 'GoogleCloudStorage:Uploads',
	get
	// store setted bellow
});

const GoogleCloudStorageAvatars = new FileUploadClass({
	name: 'GoogleCloudStorage:Avatars',
	get
	// store setted bellow
});

const configure = _.debounce(function() {
	const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
	const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
	const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');

	if (!bucket || !accessId || !secret) {
		return;
	}

	const config = {
		connection: {
			credentials: {
				client_email: accessId,
				private_key: secret
			}
		},
		bucket,
		URLExpiryTimeSpan
	};

	GoogleCloudStorageUploads.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUploads.name, config);
	GoogleCloudStorageAvatars.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageAvatars.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
