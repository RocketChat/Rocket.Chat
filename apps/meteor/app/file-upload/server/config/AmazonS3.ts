import http from 'http';
import https from 'https';
import URL from 'url';

import _ from 'underscore';

import { settings } from '../../../settings/server';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import type { S3Options } from '../../ufs/AmazonS3/server';

const get: FileUploadClass['get'] = async function (this: FileUploadClass, file, req, res) {
	const { query } = URL.parse(req.url || '', true);
	const forceDownload = typeof query.download !== 'undefined';

	const fileUrl = await this.store.getRedirectURL(file, forceDownload);
	if (!fileUrl || !file.store) {
		res.end();
		return;
	}

	const storeType = file.store.split(':').pop();
	if (settings.get(`FileUpload_S3_Proxy_${storeType}`)) {
		const request = /^https:/.test(fileUrl) ? https : http;

		FileUpload.proxyFile(file.name || '', fileUrl, forceDownload, request, req, res);
		return;
	}

	FileUpload.redirectToFile(fileUrl, req, res);
};

const copy: FileUploadClass['copy'] = async function (this: FileUploadClass, file, out) {
	const fileUrl = await this.store.getRedirectURL(file);
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

const configure = _.debounce(function () {
	const Bucket = settings.get('FileUpload_S3_Bucket') as string;
	const Acl = settings.get('FileUpload_S3_Acl') as string;
	const AWSAccessKeyId = settings.get('FileUpload_S3_AWSAccessKeyId') as string;
	const AWSSecretAccessKey = settings.get('FileUpload_S3_AWSSecretAccessKey') as string;
	const URLExpiryTimeSpan = settings.get('FileUpload_S3_URLExpiryTimeSpan') as number;
	const Region = settings.get('FileUpload_S3_Region') as string;
	const SignatureVersion = settings.get('FileUpload_S3_SignatureVersion') as string;
	const ForcePathStyle = settings.get('FileUpload_S3_ForcePathStyle') as boolean;
	// const CDN = RocketChat.settings.get('FileUpload_S3_CDN');
	const BucketURL = settings.get('FileUpload_S3_BucketURL') as string;

	if (!Bucket) {
		return;
	}

	const config: Omit<S3Options, 'name' | 'getPath'> = {
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

settings.watchByRegex(/^FileUpload_S3_/, configure);
