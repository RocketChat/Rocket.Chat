/* globals FileUpload, UploadFS, RocketChatFile */

import fs from 'fs';
import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/AmazonS3/server.js';

const Future = Npm.require('fibers/future');

const insert = function(file, stream, cb) {
	const fileId = this.store.create(file);

	this.store.write(stream, fileId, cb);
};

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
	// store setted bellow

	get,
	insert
});

const AmazonS3Avatars = new FileUploadClass({
	name: 'AmazonS3:Avatars',
	// store setted bellow

	get,
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
		onValidate
	}, config));

	AmazonS3Avatars.store = new UploadFS.store.AmazonS3(Object.assign({
		collection: AmazonS3Avatars.model.model,
		name: AmazonS3Avatars.name,
		onFinishUpload(file) {
			// update file record to match user's username
			const user = RocketChat.models.Users.findOneById(file.userId);
			const oldAvatar = AmazonS3Avatars.model.findOneByName(user.username);
			if (oldAvatar) {
				try {
					AmazonS3Avatars.deleteById(oldAvatar._id);
				} catch (e) {
					console.error(e);
				}
			}
			AmazonS3Avatars.model.updateFileNameById(file._id, user.username);
			// console.log('upload finished ->', file);
		},
		onValidate(file) {
			if (RocketChatFile.enabled === false || RocketChat.settings.get('Accounts_AvatarResize') !== true) {
				return;
			}

			const tmpFile = UploadFS.getTempFilePath(file._id);

			const fut = new Future();

			const height = RocketChat.settings.get('Accounts_AvatarSize');
			const width = height;

			RocketChatFile.gm(tmpFile).background('#ffffff').resize(width, `${ height }^`).gravity('Center').crop(width, height).extent(width, height).setFormat('jpeg').write(tmpFile, Meteor.bindEnvironment((err) => {
				if (err != null) {
					console.error(err);
				}

				const size = fs.lstatSync(tmpFile).size;
				this.getCollection().direct.update({_id: file._id}, {$set: {size}});
				fut.return();
			}));

			return fut.wait();
		}
	}, config));

}, 500);

RocketChat.settings.get(/^FileUpload_S3_/, configure);
