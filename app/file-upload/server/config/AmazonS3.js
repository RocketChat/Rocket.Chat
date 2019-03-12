import _ from 'underscore';
import { settings } from 'meteor/rocketchat:settings';
import { FileUploadClass } from '../lib/FileUpload';
import { FileUpload } from '../lib/FileUpload';
import '../../ufs/AmazonS3/server.js';
import http from 'http';
import https from 'https';

const get = function(file, req, res) {
	const fileUrl = this.store.getRedirectURL(file);

	if (fileUrl) {
		const storeType = file.store.split(':').pop();
		if (settings.get(`FileUpload_S3_Proxy_${ storeType }`)) {
			const request = /^https:/.test(fileUrl) ? https : http;
			request.get(fileUrl, (fileRes) => fileRes.pipe(res));
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

const copy = function(file, out) {
	const fileUrl = this.store.getRedirectURL(file);

	if (fileUrl) {
		const request = /^https:/.test(fileUrl) ? https : http;
		request.get(fileUrl, (fileRes) => fileRes.pipe(out));
	} else {
		out.end();
	}
};

const AmazonS3Uploads = new FileUploadClass({
	name: 'AmazonS3:Uploads',
	get,
	copy,
	// store setted bellow
});

const AmazonS3Avatars = new FileUploadClass({
	name: 'AmazonS3:Avatars',
	get,
	copy,
	// store setted bellow
});

const AmazonS3UserDataFiles = new FileUploadClass({
	name: 'AmazonS3:UserDataFiles',
	get,
	copy,
	// store setted bellow
});

const configure = _.debounce(function() {
	const Bucket = settings.get('FileUpload_S3_Bucket');
	const Acl = settings.get('FileUpload_S3_Acl');
	const AWSAccessKeyId = settings.get('FileUpload_S3_AWSAccessKeyId');
	const AWSSecretAccessKey = settings.get('FileUpload_S3_AWSSecretAccessKey');
	const URLExpiryTimeSpan = settings.get('FileUpload_S3_URLExpiryTimeSpan');
	const Region = settings.get('FileUpload_S3_Region');
	const SignatureVersion = settings.get('FileUpload_S3_SignatureVersion');
	const ForcePathStyle = settings.get('FileUpload_S3_ForcePathStyle');
	// const CDN = RocketChat.settings.get('FileUpload_S3_CDN');
	const BucketURL = settings.get('FileUpload_S3_BucketURL');

	if (!Bucket) {
		return;
	}

	const config = {
		connection: {
			signatureVersion: SignatureVersion,
			s3ForcePathStyle: ForcePathStyle,
			params: {
				Bucket,
				ACL: Acl,
			},
			region: Region,
		},
		URLExpiryTimeSpan,
	};

	if (AWSAccessKeyId) {
		config.connection.accessKeyId = AWSAccessKeyId;
	}

	if (AWSSecretAccessKey) {
		config.connection.secretAccessKey = AWSSecretAccessKey;
	}

	if (BucketURL) {
		config.connection.endpoint = BucketURL;
	}

	AmazonS3Uploads.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Uploads.name, config);
	AmazonS3Avatars.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Avatars.name, config);
	AmazonS3UserDataFiles.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3UserDataFiles.name, config);
}, 500);

settings.get(/^FileUpload_S3_/, configure);
