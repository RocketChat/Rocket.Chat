import fs from 'fs';
import { unlink } from 'fs/promises';
import { isNativeError } from 'util/types';

import type { IUpload } from '@rocket.chat/core-typings';
import mkdirp from 'mkdirp';

import { UploadFS } from './ufs';
import { Store, type StoreOptions } from './ufs-store';

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

		fs.stat(path, (err) => {
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
				fs.chmod(path, mode, (err) => {
					err && console.error(`LocalStore: cannot set store permissions ${mode} (${err.message})`);
				});
			}
		});

		this.getPath = function (file) {
			return path + (file ? `/${file}` : '');
		};

		this.delete = async (fileId, options) => {
			const path = await this.getFilePath(fileId);

			let success = false;

			try {
				await unlink(path);
				success = true;
			} catch (err) {
				if (!isNativeError(err) || !('code' in err) || err.code !== 'ENOENT') {
					success = true;
				} else {
					console.error(`LocalStore: cannot delete file "${path}" (${err.message})`);
				}
			} finally {
				this.deleteTempFile(fileId);
				if (success) {
					await this.getCollection().removeById(fileId, { session: options?.session });
				}
			}
		};

		this.getReadStream = async (fileId: string, file: IUpload, options?: { start?: number; end?: number }) => {
			options = Object.assign({}, options);
			return fs.createReadStream(await this.getFilePath(fileId, file), {
				flags: 'r',
				encoding: undefined,
				autoClose: true,
				start: options.start,
				end: options.end,
			});
		};

		this.getWriteStream = async (fileId: string, file: IUpload, options?: { start?: number }) => {
			options = Object.assign({}, options);
			return fs.createWriteStream(await this.getFilePath(fileId, file), {
				flags: 'a',
				encoding: undefined,
				mode: writeMode,
				start: options.start,
			});
		};
	}

	async getFilePath(fileId: string, fileParam?: IUpload): Promise<string> {
		const file = fileParam || (await this.getCollection().findOne(fileId, { projection: { extension: 1 } }));
		return (file && this.getPath(fileId + (file.extension ? `.${file.extension}` : ''))) || '';
	}
}

// Add store to UFS namespace
UploadFS.store.Local = LocalStore;
