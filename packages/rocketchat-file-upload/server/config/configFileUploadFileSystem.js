/* globals FileUpload, UploadFS, RocketChatFile */

import fs from 'fs';
import { FileUploadClass } from '../lib/FileUpload';

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
	}
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
	}
});


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
		transformWrite: FileUpload.uploadsTransformWrite
	});

	UploadFS.getStores()['fileSystem'] = UploadFS.getStores()[FileSystemUploads.name];

	FileSystemAvatars.store = new UploadFS.store.Local({
		path: RocketChat.settings.get('FileUpload_FileSystemPath'), //'/tmp/uploads/photos',
		collection: FileSystemAvatars.model.model,
		name: FileSystemAvatars.name,
		transformWrite: FileUpload.avatarTransformWrite,
		onFinishUpload: FileUpload.avatarsOnFinishUpload
	});
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);
