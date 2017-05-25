/* globals FileUpload, UploadFS, RocketChatFile */

import fs from 'fs';
import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/server.js';

const Future = Npm.require('fibers/future');

const insert = function(file, stream, cb) {
	const fileId = this.store.create(file);

	this.store.write(stream, fileId, cb);
};

const AmazonS3ServerUploads = new FileUploadClass({
	name: 'AmazonS3Server:Uploads',
	// store setted bellow

	get(file, req, res) {
		const fileUrl = AmazonS3ServerUploads.store.getS3URL(file);

		if (fileUrl) {
			res.setHeader('Location', fileUrl);
			res.writeHead(302);
		}
		res.end();
	},

	insert
});

const onValidate = function(file) {
	if (RocketChatFile.enabled === false || !/^image\/((x-windows-)?bmp|p?jpeg|png)$/.test(file.type)) {
		return;
	}

	const tmpFile = UploadFS.getTempFilePath(file._id);

	const fut = new Future();

	const identify = Meteor.bindEnvironment((err, data) => {
		if (err != null) {
			console.error(err);
			return fut.return();
		}

		file.identify = {
			format: data.format,
			size: data.size
		};

		if ([null, undefined, '', 'Unknown', 'Undefined'].includes(data.Orientation)) {
			return fut.return();
		}

		RocketChatFile.gm(tmpFile).autoOrient().write(tmpFile, Meteor.bindEnvironment((err) => {
			if (err != null) {
				console.error(err);
			}

			const size = fs.lstatSync(tmpFile).size;
			this.getCollection().direct.update({_id: file._id}, {$set: {size}});
			fut.return();
		}));
	});

	RocketChatFile.gm(tmpFile).identify(identify);

	return fut.wait();
};

const configure = _.debounce(function() {
	const stores = UploadFS.getStores();
	delete stores[AmazonS3ServerUploads.name];

	const Bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
	const Acl = RocketChat.settings.get('FileUpload_S3_Acl');
	const AWSAccessKeyId = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
	const AWSSecretAccessKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
	const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');
	const Region = RocketChat.settings.get('FileUpload_S3_Region');
	// const CDN = RocketChat.settings.get('FileUpload_S3_CDN');
	// const BucketURL = RocketChat.settings.get('FileUpload_S3_BucketURL');

	AmazonS3ServerUploads.store = new UploadFS.store.AmazonS3({
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
		URLExpiryTimeSpan,
		collection: AmazonS3ServerUploads.model.model,
		filter: new UploadFS.Filter({
			onCheck: FileUpload.validateFileUpload
		}),
		name: AmazonS3ServerUploads.name,
		onFinishUpload(file) {
			AmazonS3ServerUploads.model.update({_id: file._id}, {
				$set: {
					s3: file.s3
				}
			});
		},
		onValidate
	});

}, 500);

RocketChat.settings.get(/^FileUpload_S3_/, configure);
