import fs from 'fs';

import { Meteor } from 'meteor/meteor';
import { UploadFS } from 'meteor/jalik:ufs';

import { settings } from '../../../settings/server';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import { getFileRange, setRangeHeaders } from '../lib/ranges';

const statSync = Meteor.wrapAsync(fs.stat);

const FileSystemUploads = new FileUploadClass({
	name: 'FileSystem:Uploads',
	// store setted bellow

	get(file, req, res) {
		const filePath = this.store.getFilePath(file._id, file);

		const options = {};

		try {
			const stat = statSync(filePath);
			if (!stat?.isFile()) {
				res.writeHead(404);
				res.end();
				return;
			}

			file = FileUpload.addExtensionTo(file);
			res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
			res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
			res.setHeader('Content-Type', file.type || 'application/octet-stream');

			if (req.headers.range) {
				const range = getFileRange(file, req);

				if (range) {
					setRangeHeaders(range, file, res);
					if (range.outOfRange) {
						return;
					}
					options.start = range.start;
					options.end = range.stop;
				}
			}

			// set content-length if range has not set
			if (!res.getHeader('Content-Length')) {
				res.setHeader('Content-Length', file.size);
			}

			this.store.getReadStream(file._id, file, options).pipe(res);
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},

	copy(file, out) {
		const filePath = this.store.getFilePath(file._id, file);
		try {
			const stat = statSync(filePath);

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
			const stat = statSync(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);

				this.store.getReadStream(file._id, file).pipe(res);
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
			const stat = statSync(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);
				res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
				res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type);
				res.setHeader('Content-Length', file.size);

				this.store.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},
});

settings.watch('FileUpload_FileSystemPath', function () {
	const options = {
		path: settings.get('FileUpload_FileSystemPath'), // '/tmp/uploads/photos',
	};

	FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
	FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options);
	FileSystemUserDataFiles.store = FileUpload.configureUploadsStore('Local', FileSystemUserDataFiles.name, options);

	// DEPRECATED backwards compatibililty (remove)
	UploadFS.getStores().fileSystem = UploadFS.getStores()[FileSystemUploads.name];
});
