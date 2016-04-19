/* globals FileSystemStore:true, FileUpload, UploadFS, RocketChatFile */

let storeName = 'fileSystem';

FileSystemStore = null;

let createFileSystemStore = _.debounce(function() {
	let stores = UploadFS.getStores();
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
		transformWrite: function(readStream, writeStream, fileId, file) {
			var identify, stream;
			if (RocketChatFile.enabled === false || !/^image\/.+/.test(file.type)) {
				return readStream.pipe(writeStream);
			}
			stream = void 0;
			identify = function(err, data) {
				var ref;
				if (err != null) {
					return stream.pipe(writeStream);
				}
				file.identify = {
					format: data.format,
					size: data.size
				};
				if ((data.Orientation != null) && ((ref = data.Orientation) !== '' && ref !== 'Unknown' && ref !== 'Undefined')) {
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

var fs = Npm.require('fs');

FileUpload.addHandler(storeName, {
	get(file, req, res) {
		let filePath = FileSystemStore.getFilePath(file._id, file);

		try {
			let stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(file.name) + '"');
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
