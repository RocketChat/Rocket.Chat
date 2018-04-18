/* globals FileUpload */

import _ from 'underscore';
import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/AmazonS3/server.js';
import http from 'http';
import https from 'https';

const get = function(file, req, res) {
	const fileUrl = this.store.getRedirectURL(file);

	if (fileUrl) {
		const storeType = file.store.split(':').pop();
		if (RocketChat.settings.get(`FileUpload_S3_Proxy_${ storeType }`)) {
			const request = /^https:/.test(fileUrl) ? https : http;
			request.get(fileUrl, fileRes => fileRes.pipe(res));
		} else {
			res.removeHeader('Content-Length');
			res.setHeader('Location', fileUrl);
			res.writeHead(302);
			res.end();
		}
	} else {
		res.end();
	}
};

const AmazonS3Uploads = new FileUploadClass({
	name: 'AmazonS3:Uploads',
	get
	// store setted bellow
});

const AmazonS3Avatars = new FileUploadClass({
	name: 'AmazonS3:Avatars',
	get
	// store setted bellow
});

const configure = _.debounce(function() {
	const Bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
	const Acl = RocketChat.settings.get('FileUpload_S3_Acl');
	const AWSAccessKeyId = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
	const AWSSecretAccessKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
	const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');
	const Region = RocketChat.settings.get('FileUpload_S3_Region');
	const SignatureVersion = RocketChat.settings.get('FileUpload_S3_SignatureVersion');
	const ForcePathStyle = RocketChat.settings.get('FileUpload_S3_ForcePathStyle');
	// const CDN = RocketChat.settings.get('FileUpload_S3_CDN');
	const BucketURL = RocketChat.settings.get('FileUpload_S3_BucketURL');

	if (!Bucket || !AWSAccessKeyId || !AWSSecretAccessKey) {
		return;
	}

	const config = {
		connection: {
			accessKeyId: AWSAccessKeyId,
			secretAccessKey: AWSSecretAccessKey,
			signatureVersion: SignatureVersion,
			s3ForcePathStyle: ForcePathStyle,
			params: {
				Bucket,
				ACL: Acl
			},
			region: Region
		},
		URLExpiryTimeSpan
	};

	if (BucketURL) {
		config.connection.endpoint = BucketURL;
	}

	AmazonS3Uploads.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Uploads.name, config);
	AmazonS3Avatars.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Avatars.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_S3_/, configure);
