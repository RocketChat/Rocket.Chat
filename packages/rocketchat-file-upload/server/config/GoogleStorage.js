/* globals FileUpload */

import _ from 'underscore';
import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/GoogleStorage/server.js';
import http from 'http';
import https from 'https';

const get = function(file, req, res) {
	this.store.getRedirectURL(file, (err, fileUrl) => {
		if (err) {
			console.error(err);
		}

		if (fileUrl) {
			if (RocketChat.settings.get('FileUpload_GoogleStorage_Proxy')) {
				const request = /^https:/.test(fileUrl) ? https : http;
				request.get(fileUrl, fileRes => fileRes.pipe(res));
			} else {
				res.setHeader('Location', fileUrl);
				res.writeHead(302);
				res.end();
			}
		} else {
			res.end();
		}
	});
};

const copy = function(file, out) {
	this.store.getRedirectURL(file, (err, fileUrl) => {
		if (err) {
			console.error(err);
		}

		if (fileUrl) {
			const request = /^https:/.test(fileUrl) ? https : http;
			request.get(fileUrl, fileRes => fileRes.pipe(out));
		} else {
			out.end();
		}
	});
};

const GoogleCloudStorageUploads = new FileUploadClass({
	name: 'GoogleCloudStorage:Uploads',
	get,
	copy
	// store setted bellow
});

const GoogleCloudStorageAvatars = new FileUploadClass({
	name: 'GoogleCloudStorage:Avatars',
	get,
	copy
	// store setted bellow
});

const GoogleCloudStorageUserDataFiles = new FileUploadClass({
	name: 'GoogleCloudStorage:UserDataFiles',
	get,
	copy
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
	GoogleCloudStorageUserDataFiles.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
