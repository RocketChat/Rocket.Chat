/* globals FileUpload, UploadFS, RocketChatFile */

import fs from 'fs';
import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/GoogleStorage/server.js';

const Future = Npm.require('fibers/future');

const insert = function(file, stream, cb) {
	const fileId = this.store.create(file);

	this.store.write(stream, fileId, cb);
};

const get = function(file, req, res) {
	this.store.getRedirectURL(file, (err, fileUrl) => {
		if (err) {
			console.error(err);
		}

		if (fileUrl) {
			res.setHeader('Location', fileUrl);
			res.writeHead(302);
		}
		res.end();
	});
};

const GoogleCloudStorageUploads = new FileUploadClass({
	name: 'GoogleCloudStorage:Uploads',
	// store setted bellow

	get,
	insert
});

const GoogleCloudStorageAvatars = new FileUploadClass({
	name: 'GoogleCloudStorage:Avatars',
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
	delete stores[GoogleCloudStorageUploads.name];
	delete stores[GoogleCloudStorageAvatars.name];

	// const type = RocketChat.settings.get('FileUpload_Storage_Type');
	const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
	const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
	const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');

	const config = {
		connection: {
			credentials: {
				client_email: accessId,
				private_key: secret
			}
		},
		bucket,
		URLExpiryTimeSpan
	};

	GoogleCloudStorageUploads.store = new UploadFS.store.GoogleStorage(Object.assign({
		collection: GoogleCloudStorageUploads.model.model,
		filter: new UploadFS.Filter({
			onCheck: FileUpload.validateFileUpload
		}),
		name: GoogleCloudStorageUploads.name,
		onValidate
	}, config));

	GoogleCloudStorageAvatars.store = new UploadFS.store.GoogleStorage(Object.assign({
		collection: GoogleCloudStorageAvatars.model.model,
		name: GoogleCloudStorageAvatars.name,
		onFinishUpload(file) {
			// update file record to match user's username
			const user = RocketChat.models.Users.findOneById(file.userId);
			const oldAvatar = GoogleCloudStorageAvatars.model.findOneByName(user.username);
			if (oldAvatar) {
				try {
					GoogleCloudStorageAvatars.deleteById(oldAvatar._id);
				} catch (e) {
					console.error(e);
				}
			}
			GoogleCloudStorageAvatars.model.updateFileNameById(file._id, user.username);
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

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
