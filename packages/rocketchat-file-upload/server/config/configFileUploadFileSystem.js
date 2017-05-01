/* globals FileSystemStore:true, FileUpload, UploadFS, RocketChatFile, FileSystemStoreAvatar */

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

FileSystemStore = null;
FileSystemStoreAvatar = null;

const createFileSystemStore = _.debounce(function() {
	const stores = UploadFS.getStores();
	delete stores.fileSystem;
	delete stores.fileSystemAvatar;

	FileSystemStore = new UploadFS.store.Local({
		path: RocketChat.settings.get('FileUpload_FileSystemPath'), //'/tmp/uploads/photos',
		collection: RocketChat.models.Uploads.model,
		filter: new UploadFS.Filter({
			onCheck: FileUpload.validateFileUpload
		}),
		name: 'fileSystem',
		transformWrite
	});

	FileSystemStoreAvatar = new UploadFS.store.Local({
		path: RocketChat.settings.get('FileUpload_FileSystemPath'), //'/tmp/uploads/photos',
		collection: RocketChat.models.Avatars.model,
		name: 'fileSystemAvatar',
		transformWrite: FileUpload.avatarTransformWrite,
		onFinishUpload(file) {
			// update file record to match user's username
			const user = RocketChat.models.Users.findOneById(file.userId);
			const oldAvatar = RocketChat.models.Avatars.findOneByName(user.username);
			if (oldAvatar) {
				try {
					FileSystemStoreAvatar.delete(oldAvatar._id);
					RocketChat.models.Avatars.deleteFile(oldAvatar._id);
				} catch (e) {
					console.error(e);
				}
			}
			RocketChat.models.Avatars.updateFileNameById(file._id, user.username);
			// console.log('upload finished ->', file);
		}
	});
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);

const fs = Npm.require('fs');

FileUpload.addHandler('fileSystem', {
	get(file, req, res) {
		const filePath = FileSystemStore.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);
				res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${ encodeURIComponent(file.name) }`);
				res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type);
				res.setHeader('Content-Length', file.size);

				FileSystemStore.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
			return;
		}
	},

	delete(file) {
		return FileSystemStore.delete(file._id);
	}
});

FileUpload.addHandler('fileSystemAvatar', {
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

		const filePath = FileSystemStoreAvatar.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);
				res.setHeader('Content-Disposition', 'inline');
				res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type);
				res.setHeader('Content-Length', file.size);

				FileSystemStoreAvatar.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
			return;
		}
	},

	delete(file) {
		return FileSystemStoreAvatar.delete(file._id);
	}
});
