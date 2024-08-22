import fsp from 'fs/promises';

import { UploadFS } from '../../../../server/ufs';
import { settings } from '../../../settings/server';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import { getFileRange, setRangeHeaders } from '../lib/ranges';
import { getContentDisposition } from './helper';

const FileSystemUploads = new FileUploadClass({
	name: 'FileSystem:Uploads',
	// store setted bellow

	async get(file, req, res) {
		if (!this.store || !file) {
			return;
		}
		const filePath = await this.store.getFilePath(file._id, file);

		const options: { start?: number; end?: number } = {};

		try {
			const stat = await fsp.stat(filePath);
			if (!stat?.isFile()) {
				res.writeHead(404);
				res.end();
				return;
			}

			file = FileUpload.addExtensionTo(file);

			res.setHeader('Content-Disposition', `${getContentDisposition(req)}; filename*=UTF-8''${encodeURIComponent(file.name || '')}`);
			file.uploadedAt && res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
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
				res.setHeader('Content-Length', file.size || 0);
			}

			(await this.store.getReadStream(file._id, file, options)).pipe(res);
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},

	async copy(file, out) {
		if (!this.store) {
			return;
		}
		const filePath = await this.store.getFilePath(file._id, file);
		try {
			const stat = await fsp.stat(filePath);

			if (stat?.isFile()) {
				file = FileUpload.addExtensionTo(file);

				(await this.store.getReadStream(file._id, file)).pipe(out);
			}
		} catch (e) {
			out.end();
		}
	},
});

const FileSystemAvatars = new FileUploadClass({
	name: 'FileSystem:Avatars',
	// store setted bellow

	async get(file, _req, res) {
		if (!this.store) {
			return;
		}
		const filePath = await this.store.getFilePath(file._id, file);

		try {
			const stat = await fsp.stat(filePath);

			if (stat?.isFile()) {
				file = FileUpload.addExtensionTo(file);

				(await this.store.getReadStream(file._id, file)).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},
});

const FileSystemUserDataFiles = new FileUploadClass({
	name: 'FileSystem:UserDataFiles',

	async get(file, _req, res) {
		if (!this.store) {
			return;
		}
		const filePath = await this.store.getFilePath(file._id, file);

		try {
			const stat = await fsp.stat(filePath);

			if (stat?.isFile()) {
				file = FileUpload.addExtensionTo(file);
				res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name || '')}`);
				file.uploadedAt && res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type || '');
				res.setHeader('Content-Length', file.size || 0);

				(await this.store.getReadStream(file._id, file)).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},
});

settings.watch('FileUpload_FileSystemPath', () => {
	const options = {
		path: settings.get('FileUpload_FileSystemPath'), // '/tmp/uploads/photos',
	};

	FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
	FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options);
	FileSystemUserDataFiles.store = FileUpload.configureUploadsStore('Local', FileSystemUserDataFiles.name, options);

	// DEPRECATED backwards compatibility (remove)
	UploadFS.getStores().fileSystem = UploadFS.getStores()[FileSystemUploads.name];
});
