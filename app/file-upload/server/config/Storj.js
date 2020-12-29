import http from 'http';
import https from 'https';

import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../../settings';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import '../../ufs/Storj/server.js';

const get = function(file, req, res) {
	const forceDownload = typeof req.query.download !== 'undefined';
	res.setHeader('Content-Disposition', `${ forceDownload ? 'attachment' : 'inline' }; filename="${ encodeURI(file.name) }"`);

	const stream = this.store.getReadStream(file._id);
	if (!stream) {
		console.log(`Storj file not found: ${ file.name }, ${ file._id }`);
		return res.end();
	}

	stream.on('error', (err) => console.log(err));
	stream.pipe(res);
};

const copy = function(file, out) {
	const fileUrl = this.store.getRedirectURL(file);

	if (fileUrl) {
		const request = /^https:/.test(fileUrl) ? https : http;
		request.get(fileUrl, (fileRes) => fileRes.pipe(out));
	} else {
		out.end();
	}
};

// This is the class that is retrieved when using FileUpload.getStoreByName / FileUpload.getStore
const StorjUploads = new FileUploadClass({
	name: 'Storj:Uploads',
	get,
	copy,
	// store setted bellow
});

const StorjAvatars = new FileUploadClass({
	name: 'Storj:Avatars',
	get,
	copy,
	// store setted bellow
});

const StorjUserDataFiles = new FileUploadClass({
	name: 'Storj:UserDataFiles',
	get,
	copy,
	// store setted bellow
});

const configure = Meteor.bindEnvironment(_.debounce(function() {
	const bucketName = settings.get('FileUpload_Storj_Bucket');
	const accessKey = settings.get('FileUpload_Storj_AccessKey');

	if (!bucketName || !accessKey) {
		return;
	}

	const config = {
		accessKey,
		bucketName,
	};

	StorjUploads.store = FileUpload.configureUploadsStore('Storj', StorjUploads.name, config);
	StorjAvatars.store = FileUpload.configureUploadsStore('Storj', StorjAvatars.name, config);
	StorjUserDataFiles.store = FileUpload.configureUploadsStore('Storj', StorjUserDataFiles.name, config);
}, 500));

settings.get(/^FileUpload_Storj_/, configure);
