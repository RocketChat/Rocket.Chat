/* globals FileUpload, UploadFS, RocketChatFile */

import fs from 'fs';
import { FileUploadClass } from '../lib/FileUpload';

const insert = function(file, stream, cb) {
	const fileId = this.store.create(file);

	this.store.write(stream, fileId, cb);
};

const FileSystemUploads = new FileUploadClass({
	name: 'FileSystem:Uploads',
	// store setted bellow

	get(file, req, res) {
		const filePath = this.store.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);
				res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${ encodeURIComponent(file.name) }`);
				res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type);
				res.setHeader('Content-Length', file.size);

				this.store.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
			return;
		}
	},

	insert
});

const FileSystemAvatars = new FileUploadClass({
	name: 'FileSystem:Avatars',
	// store setted bellow

	get(file, req, res) {
		const reqModifiedHeader = req.headers['if-modified-since'];
		if (reqModifiedHeader) {
			if (reqModifiedHeader === (file.uploadedAt && file.uploadedAt.toUTCString())) {
				res.setHeader('Last-Modified', reqModifiedHeader);
				res.writeHead(304);
				res.end();
				return;
			}
		}

		const filePath = this.store.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);
				res.setHeader('Content-Disposition', 'inline');
				res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type);
				res.setHeader('Content-Length', file.size);

				this.store.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
			return;
		}
	},

	insert
});


const transformWrite = function(readStream, writeStream, fileId, file) {
	if (RocketChatFile.enabled === false || !/^image\/((x-windows-)?bmp|p?jpeg|png)$/.test(file.type)) {
		return readStream.pipe(writeStream);
	}

	let stream = undefined;

	const identify = function(err, data) {
		if (err != null) {
			return stream.pipe(writeStream);
		}

		file.identify = {
			format: data.format,
			size: data.size
		};

		if ([null, undefined, '', 'Unknown', 'Undefined'].indexOf(data.Orientation) === -1) {
			return RocketChatFile.gm(stream).autoOrient().stream().pipe(writeStream);
		} else {
			return stream.pipe(writeStream);
		}
	};

	stream = RocketChatFile.gm(readStream).identify(identify).stream();
	return;
};

const createFileSystemStore = _.debounce(function() {
	const stores = UploadFS.getStores();
	delete stores['FileSystem:Uploads'];
	delete stores['FileSystem:Avatars'];

	FileSystemUploads.store = new UploadFS.store.Local({
		path: RocketChat.settings.get('FileUpload_FileSystemPath'), //'/tmp/uploads/photos',
		collection: FileSystemUploads.model.model,
		filter: new UploadFS.Filter({
			onCheck: FileUpload.validateFileUpload
		}),
		name: FileSystemUploads.name,
		transformWrite
	});

	UploadFS.getStores()['fileSystem'] = UploadFS.getStores()[FileSystemUploads.name];

	FileSystemAvatars.store = new UploadFS.store.Local({
		path: RocketChat.settings.get('FileUpload_FileSystemPath'), //'/tmp/uploads/photos',
		collection: FileSystemAvatars.model.model,
		name: FileSystemAvatars.name,
		transformWrite: FileUpload.avatarTransformWrite,
		onFinishUpload(file) {
			// update file record to match user's username
			const user = RocketChat.models.Users.findOneById(file.userId);
			const oldAvatar = FileSystemAvatars.model.findOneByName(user.username);
			if (oldAvatar) {
				try {
					FileSystemAvatars.deleteById(oldAvatar._id);
				} catch (e) {
					console.error(e);
				}
			}
			FileSystemAvatars.model.updateFileNameById(file._id, user.username);
			// console.log('upload finished ->', file);
		}
	});
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);
