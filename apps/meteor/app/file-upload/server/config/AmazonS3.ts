import http from 'node:http';
import https from 'node:https';

import _ from 'underscore';

import { forceDownload } from './helper';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import type { S3Options } from '../../ufs/AmazonS3/server';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import '../../ufs/AmazonS3/server';

const hasScheme = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);

const get: FileUploadClass['get'] = async function (this: FileUploadClass, file, req, res) {
	const forcedDownload = forceDownload(req);

	const fileUrl = await this.store.getRedirectURL(file, forcedDownload);
	if (!fileUrl || !file.store) {
		res.end();
		return;
	}

	const storeType = file.store.split(':').pop();
	if (settings.get(`FileUpload_S3_Proxy_${storeType}`)) {
		const request = /^https:/.test(fileUrl) ? https : http;

		FileUpload.proxyFile(file.name || '', fileUrl, forcedDownload, request, req, res);
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

const configure = _.debounce(() => {
	const Bucket = settings.get<string>('FileUpload_S3_Bucket');
	const Acl = settings.get<string>('FileUpload_S3_Acl');
	const AWSAccessKeyId = settings.get<string>('FileUpload_S3_AWSAccessKeyId');
	const AWSSecretAccessKey = settings.get<string>('FileUpload_S3_AWSSecretAccessKey');
	const URLExpiryTimeSpan = settings.get<number>('FileUpload_S3_URLExpiryTimeSpan');
	const Region = settings.get<string>('FileUpload_S3_Region');
	const ForcePathStyle = settings.get<boolean>('FileUpload_S3_ForcePathStyle');
	// const CDN = RocketChat.settings.get('FileUpload_S3_CDN');
	const BucketURL = settings.get<string>('FileUpload_S3_BucketURL');

	if (!Bucket) {
		return;
	}

	const config: Omit<S3Options, 'name' | 'getPath'> = {
		connection: {
			forcePathStyle: ForcePathStyle,
			followRegionRedirects: true,
		},
		params: {
			Bucket,
			ACL: Acl,
		},
		URLExpiryTimeSpan,
	};

	if (Region) {
		config.connection.region = Region;
	}

	// Back-compat: AWS SDK v2 defaulted unset region to us-east-1; v3 throws.
	if (!Region && !process.env.AWS_REGION) {
		config.connection.region = 'us-east-1';
		SystemLogger.warn(
			'FileUpload_S3_Region is empty and AWS_REGION is not set; defaulting to us-east-1. Set FileUpload_S3_Region or AWS_REGION to silence this warning.',
		);
	}

	if (AWSAccessKeyId && AWSSecretAccessKey) {
		config.connection.credentials = {
			accessKeyId: AWSAccessKeyId,
			secretAccessKey: AWSSecretAccessKey,
		};
	}

	// Back-compat: AWS SDK v2 accepted scheme-less endpoints; v3 throws.
	if (BucketURL) {
		const isValidScheme = hasScheme(BucketURL);
		config.connection.endpoint = isValidScheme ? BucketURL : `https://${BucketURL}`;
		if (!isValidScheme) {
			SystemLogger.warn(`FileUpload_S3_BucketURL "${BucketURL}" has no scheme; defaulting to "https://${BucketURL}".`);
		}
	}

	AmazonS3Uploads.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Uploads.name, config);
	AmazonS3Avatars.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Avatars.name, config);
	AmazonS3UserDataFiles.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3UserDataFiles.name, config);
}, 500);

settings.watchByRegex(/^FileUpload_S3_/, configure);
