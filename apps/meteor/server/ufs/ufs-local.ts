import fs from 'fs';

import { Meteor } from 'meteor/meteor';
import mkdirp from 'mkdirp';

import { UploadFS } from '.';
import type { StoreOptions } from './ufs-store';
import { Store } from './ufs-store';
import type { IFile } from './definition';

type LocalStoreOptions = StoreOptions & {
	mode?: string;
	path?: string;
	writeMode?: number;
};

export class LocalStore extends Store {
	protected getPath: (file: string) => string;

	constructor(options: LocalStoreOptions) {
		// Default options
		options = {
			mode: '0744',
			path: 'ufs/uploads',
			writeMode: 0o744,
			...options,
		};

		// Check options
		if (typeof options.mode !== 'string') {
			throw new TypeError('LocalStore: mode is not a string');
		}
		if (typeof options.path !== 'string') {
			throw new TypeError('LocalStore: path is not a string');
		}
		if (typeof options.writeMode !== 'number') {
			throw new TypeError('LocalStore: writeMode is not a string');
		}

		super(options);

		// Private attributes
		const { mode } = options;
		const { path } = options;
		const { writeMode } = options;

		fs.stat(path, function (err) {
			if (err) {
				// Create the directory
				mkdirp(path, { mode })
					.then(() => {
						console.info(`LocalStore: store created at ${path}`);
					})
					.catch((err) => {
						console.error(`LocalStore: cannot create store at ${path} (${err.message})`);
					});
			} else {
				// Set directory permissions
				fs.chmod(path, mode, function (err) {
					err && console.error(`LocalStore: cannot set store permissions ${mode} (${err.message})`);
				});
			}
		});

		this.getPath = function (file) {
			return path + (file ? `/${file}` : '');
		};

		this.delete = (fileId, callback) => {
			const path = this.getFilePath(fileId);

			if (typeof callback !== 'function') {
				callback = function (err) {
					err && console.error(`LocalStore: cannot delete file "${fileId}" at ${path} (${err.message})`);
				};
			}
			fs.stat(
				path,
				Meteor.bindEnvironment((err, stat) => {
					if (!err && stat && stat.isFile()) {
						fs.unlink(
							path,
							Meteor.bindEnvironment(() => {
								void this.removeById(fileId);
								callback?.call(this);
							}),
						);
					}
				}),
			);
		};

		this.getReadStream = (fileId: string, file: IFile, options?: { start?: number; end?: number }) => {
			options = Object.assign({}, options);
			return fs.createReadStream(this.getFilePath(fileId, file), {
				flags: 'r',
				encoding: undefined,
				autoClose: true,
				start: options.start,
				end: options.end,
			});
		};

		this.getWriteStream = (fileId: string, file: IFile, options?: { start?: number }) => {
			options = Object.assign({}, options);
			return fs.createWriteStream(this.getFilePath(fileId, file), {
				flags: 'a',
				encoding: undefined,
				mode: writeMode,
				start: options.start,
			});
		};
	}

	getFilePath(fileId: string, fileParam?: IFile): string {
		const file = fileParam || Promise.await(this.getCollection().findOne(fileId, { projection: { extension: 1 } }));
		return (file && this.getPath(fileId + (file.extension ? `.${file.extension}` : ''))) || '';
	}
}

// Add store to UFS namespace
UploadFS.store.Local = LocalStore;
