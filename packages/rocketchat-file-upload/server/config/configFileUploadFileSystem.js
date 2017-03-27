/* globals FileSystemStore:true, FileUpload, UploadFS, RocketChatFile */

const storeName = 'fileSystem';

FileSystemStore = null;

const createFileSystemStore = _.debounce(function() {
	const stores = UploadFS.getStores();
	if (stores[storeName]) {
		delete stores[storeName];
	}
	FileSystemStore = new UploadFS.store.Local({
		collection: RocketChat.models.Uploads.model,
		name: storeName,
		path: RocketChat.settings.get('FileUpload_FileSystemPath'), //'/tmp/uploads/photos',
		filter: new UploadFS.Filter({
			onCheck: FileUpload.validateFileUpload
		}),
		transformWrite(readStream, writeStream, fileId, file) {
			if (RocketChatFile.enabled === false || !/^image\/((x-windows-)?bmp|p?jpeg|png)$/.test(file.type)) {
				return readStream.pipe(writeStream);
			}

			let stream = void 0;

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
		}
	});
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);

const fs = Npm.require('fs');

FileUpload.addHandler(storeName, {
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
