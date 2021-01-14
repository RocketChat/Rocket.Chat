import fs from 'fs';

import { Meteor } from 'meteor/meteor';
import { UploadFS } from 'meteor/jalik:ufs';
import _ from 'underscore';

import { settings } from '../../../settings';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';

const getByteRange = function(header) {
	if (header) {
		const matches = header.match(/(\d+)-(\d+)/);
		if (matches) {
			return {
				start: parseInt(matches[1], 10),
				stop: parseInt(matches[2], 10),
			};
		}
	}
	return null;
};

// code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L310
const readFromFileSystem = function(store, fileId, file, req, res) {
	const range = getByteRange(req.headers.range);
	let out_of_range = false;
	if (range) {
		out_of_range = (range.start >= file.size) || (range.stop < range.start);
		if (range.stop >= file.size - 1) {
			range.stop = file.size - 1;
		}
	}

	if (range && out_of_range) {
		// out of range request, return 416
		res.removeHeader('Content-Length');
		res.removeHeader('Content-Type');
		res.removeHeader('Content-Disposition');
		res.removeHeader('Last-Modified');
		res.setHeader('Content-Range', `bytes */${ file.size }`);
		res.writeHead(416);
		res.end();
	} else if (range) {
		res.setHeader('Content-Range', `bytes ${ range.start }-${ range.stop }/${ file.size }`);
		res.removeHeader('Content-Length');
		res.setHeader('Content-Length', range.stop - range.start + 1);
		res.writeHead(206);
		store.getReadStream(fileId, file, { start: range.start, end: range.stop }).pipe(res);
	} else {
		res.writeHead(200);
		store.getReadStream(fileId, file).pipe(res);
	}
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
				res.setHeader('Content-Type', file.type || 'application/octet-stream');
				res.setHeader('Content-Length', file.size);

				return readFromFileSystem(this.store, file._id, file, req, res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
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
		}
	},
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

				return readFromFileSystem(this.store, file._id, file, req, res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},
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

				return readFromFileSystem(this.store, file._id, file, req, res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},
});

const createFileSystemStore = _.debounce(function() {
	const options = {
		path: settings.get('FileUpload_FileSystemPath'), // '/tmp/uploads/photos',
	};

	FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
	FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options);
	FileSystemUserDataFiles.store = FileUpload.configureUploadsStore('Local', FileSystemUserDataFiles.name, options);

	// DEPRECATED backwards compatibililty (remove)
	UploadFS.getStores().fileSystem = UploadFS.getStores()[FileSystemUploads.name];
}, 500);

settings.get('FileUpload_FileSystemPath', createFileSystemStore);
