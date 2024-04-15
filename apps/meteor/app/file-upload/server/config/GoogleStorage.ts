import http from 'http';
import https from 'https';
import URL from 'url';

import { settings } from '../../../settings/server';
import { debounce } from '../../../utils/debounce';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import '../../ufs/GoogleStorage/server';

const get: FileUploadClass['get'] = async function (this: FileUploadClass, file, req, res) {
	const { query } = URL.parse(req.url || '', true);
	const forceDownload = typeof query.download !== 'undefined';

	const fileUrl = await this.store.getRedirectURL(file, forceDownload);
	if (!fileUrl || !file.store) {
		res.end();
		return;
	}

	const storeType = file.store.split(':').pop();
	if (settings.get(`FileUpload_GoogleStorage_Proxy_${storeType}`)) {
		const request = /^https:/.test(fileUrl) ? https : http;

		FileUpload.proxyFile(file.name || '', fileUrl, forceDownload, request, req, res);
		return;
	}

	FileUpload.redirectToFile(fileUrl, req, res);
};

const copy: FileUploadClass['copy'] = async function (this: FileUploadClass, file, out) {
	const fileUrl = await this.store.getRedirectURL(file, false);

	if (!fileUrl) {
		out.end();
		return;
	}

	const request = /^https:/.test(fileUrl) ? https : http;
	return new Promise((resolve) => {
		request.get(fileUrl, (fileRes) => fileRes.pipe(out).on('finish', () => resolve()));
	});
};

const GoogleCloudStorageUploads = new FileUploadClass({
	name: 'GoogleCloudStorage:Uploads',
	get,
	copy,
	// store setted bellow
});

const GoogleCloudStorageAvatars = new FileUploadClass({
	name: 'GoogleCloudStorage:Avatars',
	get,
	copy,
	// store setted bellow
});

const GoogleCloudStorageUserDataFiles = new FileUploadClass({
	name: 'GoogleCloudStorage:UserDataFiles',
	get,
	copy,
	// store setted bellow
});

const configure = debounce(() => {
	const bucket = settings.get('FileUpload_GoogleStorage_Bucket');
	const projectId = settings.get('FileUpload_GoogleStorage_ProjectId');
	const accessId = settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = settings.get('FileUpload_GoogleStorage_Secret');
	const URLExpiryTimeSpan = settings.get('FileUpload_S3_URLExpiryTimeSpan');

	if (!bucket || !accessId || !secret) {
		return;
	}

	const config = {
		connection: {
			credentials: {
				client_email: accessId,
				private_key: secret,
			},
			projectId,
		},
		bucket,
		URLExpiryTimeSpan,
	};

	GoogleCloudStorageUploads.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUploads.name, config);
	GoogleCloudStorageAvatars.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageAvatars.name, config);
	GoogleCloudStorageUserDataFiles.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUserDataFiles.name, config);
}, 500);

settings.watchByRegex(/^FileUpload_GoogleStorage_/, configure);
