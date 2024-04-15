import http from 'http';
import https from 'https';
import URL from 'url';

import { settings } from '../../../settings/server';
import { debounce } from '../../../utils/debounce';
import type { S3Options } from '../../ufs/AmazonS3/server';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import '../../ufs/AmazonS3/server';

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
	if (!fileUrl) {
		out.end();
		return;
	}

	const request = /^https:/.test(fileUrl) ? https : http;
	return new Promise((resolve) => {
		request.get(fileUrl, (fileRes) => fileRes.pipe(out).on('finish', () => resolve()));
	});
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

const configure = debounce(() => {
	const Bucket = settings.get<string>('FileUpload_S3_Bucket');
	const Acl = settings.get<string>('FileUpload_S3_Acl');
	const AWSAccessKeyId = settings.get<string>('FileUpload_S3_AWSAccessKeyId');
	const AWSSecretAccessKey = settings.get<string>('FileUpload_S3_AWSSecretAccessKey');
	const URLExpiryTimeSpan = settings.get<number>('FileUpload_S3_URLExpiryTimeSpan');
	const Region = settings.get<string>('FileUpload_S3_Region');
	const SignatureVersion = settings.get<string>('FileUpload_S3_SignatureVersion');
	const ForcePathStyle = settings.get<boolean>('FileUpload_S3_ForcePathStyle');
	// const CDN = RocketChat.settings.get('FileUpload_S3_CDN');
	const BucketURL = settings.get<string>('FileUpload_S3_BucketURL');

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
