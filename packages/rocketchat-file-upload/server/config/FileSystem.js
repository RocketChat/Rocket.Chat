/* globals FileUpload, UploadFS */

import _ from 'underscore';
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
	},

	copy(file, out) {
		const filePath = this.store.getFilePath(file._id, file);
		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);

				this.store.getReadStream(file._id, file).pipe(out);
			}
		} catch (e) {
			out.end();
			return;
		}
	}
});

const FileSystemAvatars = new FileUploadClass({
	name: 'FileSystem:Avatars',
	// store setted bellow

	get(file, req, res) {
		const filePath = this.store.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);

				this.store.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
			return;
		}
	}
});

const FileSystemUserDataFiles = new FileUploadClass({
	name: 'FileSystem:UserDataFiles',

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

const createFileSystemStore = _.debounce(function() {
	const options = {
		path: RocketChat.settings.get('FileUpload_FileSystemPath') //'/tmp/uploads/photos',
	};

	FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
	FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options);
	FileSystemUserDataFiles.store = FileUpload.configureUploadsStore('Local', FileSystemUserDataFiles.name, options);

	// DEPRECATED backwards compatibililty (remove)
	UploadFS.getStores()['fileSystem'] = UploadFS.getStores()[FileSystemUploads.name];
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);
