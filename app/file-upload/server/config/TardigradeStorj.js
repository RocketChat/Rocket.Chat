import http from 'http';
import https from 'https';

import _ from 'underscore';

import { settings } from '../../../settings';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import '../../ufs/TardigradeStorj/server';

const get = function(file, req, res) {
	const forceDownload = typeof req.query.download !== 'undefined';

	this.store.getRedirectURL(file, forceDownload, (err, fileUrl) => {
		if (err) {
			return console.error(err);
		}

		if (!fileUrl) {
			return res.end();
		}

		const storeType = file.store.split(':').pop();
		if (settings.get(`FileUpload_TardigradeStorj_${ storeType }`)) {
			const request = /^https:/.test(fileUrl) ? https : http;

			return FileUpload.proxyFile(file.name, fileUrl, forceDownload, request, req, res);
		}

		return FileUpload.redirectToFile(fileUrl, req, res);
	});
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

const TardigradeStorjUploads = new FileUploadClass({
	name: 'AmazonS3:Uploads',
	get,
	copy,
	// store setted bellow
});

const TardigradeStorjAvatars = new FileUploadClass({
	name: 'AmazonS3:Avatars',
	get,
	copy,
	// store setted bellow
});

const TardigradeStorjUserDataFiles = new FileUploadClass({
	name: 'AmazonS3:UserDataFiles',
	get,
	copy,
	// store setted bellow
});

const configure = _.debounce(function() {
	const Bucket = settings.get('FileUpload_TardigradeStorj_Bucket');
	const AccessGrant = settings.get('FileUpload_TardigradeStorj_AccessGrant');
	const Passphrase = settings.get('FileUpload_TardigradeStorj_Passphrase');
	// const CDN = RocketChat.settings.get('FileUpload_S3_CDN');

	if (!Bucket) {
		return;
	}

	const config = {
		connection: {
			params: {
				Bucket,
				AccessGrant,
				Passphrase,
			},
		},
	};

	TardigradeStorjUploads.store = FileUpload.configureUploadsStore('TardigradeStorj', TardigradeStorjUploads.name, config);
	TardigradeStorjAvatars.store = FileUpload.configureUploadsStore('TardigradeStorj', TardigradeStorjAvatars.name, config);
	TardigradeStorjUserDataFiles.store = FileUpload.configureUploadsStore('TardigradeStorj', TardigradeStorjUserDataFiles.name, config);
}, 500);

settings.get(/^FileUpload_TardigradeStorj_/, configure);
