/* globals FileUpload, UploadFS, RocketChatFile */

import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/AmazonS3/server.js';

const get = function(file, req, res) {
	const fileUrl = this.store.getS3URL(file);

	if (fileUrl) {
		res.setHeader('Location', fileUrl);
		res.writeHead(302);
	}
	res.end();
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
	const stores = UploadFS.getStores();
	delete stores[AmazonS3Uploads.name];
	delete stores[AmazonS3Avatars.name];

	const Bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
	const Acl = RocketChat.settings.get('FileUpload_S3_Acl');
	const AWSAccessKeyId = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
	const AWSSecretAccessKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
	const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');
	const Region = RocketChat.settings.get('FileUpload_S3_Region');
	// const CDN = RocketChat.settings.get('FileUpload_S3_CDN');
	// const BucketURL = RocketChat.settings.get('FileUpload_S3_BucketURL');

	const config = {
		connection: {
			accessKeyId: AWSAccessKeyId,
			secretAccessKey: AWSSecretAccessKey,
			signatureVersion: 'v4',
			params: {
				Bucket,
				ACL: Acl
			},
			region: Region
		},
		URLExpiryTimeSpan
	};

	AmazonS3Uploads.store = new UploadFS.store.AmazonS3(Object.assign({
		collection: AmazonS3Uploads.model.model,
		filter: new UploadFS.Filter({
			onCheck: FileUpload.validateFileUpload
		}),
		name: AmazonS3Uploads.name,
		onValidate: FileUpload.uploadsOnValidate
	}, config));

	AmazonS3Avatars.store = new UploadFS.store.AmazonS3(Object.assign({
		collection: AmazonS3Avatars.model.model,
		name: AmazonS3Avatars.name,
		onFinishUpload: FileUpload.avatarsOnFinishUpload,
		onValidate: FileUpload.avatarsOnValidate
	}, config));

}, 500);

RocketChat.settings.get(/^FileUpload_S3_/, configure);
