/* globals UploadFS */

import fs from 'fs';
import stream from 'stream';
import mime from 'mime-type/with-db';
import Future from 'fibers/future';

Object.assign(FileUpload, {
	handlers: {},

	configureUploadsStore(store, name, options) {
		const type = name.split(':').pop();
		const stores = UploadFS.getStores();
		delete stores[name];

		return new UploadFS.store[store](Object.assign({
			name
		}, options, FileUpload[`default${ type }`]()));
	},

	defaultUploads() {
		return {
			collection: RocketChat.models.Uploads.model,
			filter: new UploadFS.Filter({
				onCheck: FileUpload.validateFileUpload
			}),
			getPath(file) {
				return `${ RocketChat.settings.get('uniqueID') }/uploads/${ file.rid }/${ file.userId }/${ file._id }`;
			},
			// transformWrite: FileUpload.uploadsTransformWrite
			onValidate: FileUpload.uploadsOnValidate
		};
	},

	defaultAvatars() {
		return {
			collection: RocketChat.models.Avatars.model,
			// filter: new UploadFS.Filter({
			// 	onCheck: FileUpload.validateFileUpload
			// }),
			// transformWrite: FileUpload.avatarTransformWrite,
			getPath(file) {
				return `${ RocketChat.settings.get('uniqueID') }/avatars/${ file.userId }`;
			},
			onValidate: FileUpload.avatarsOnValidate,
			onFinishUpload: FileUpload.avatarsOnFinishUpload
		};
	},

	avatarTransformWrite(readStream, writeStream/*, fileId, file*/) {
		if (RocketChatFile.enabled === false || RocketChat.settings.get('Accounts_AvatarResize') !== true) {
			return readStream.pipe(writeStream);
		}
		const height = RocketChat.settings.get('Accounts_AvatarSize');
		const width = height;
		return (file => RocketChat.Info.GraphicsMagick.enabled ? file: file.alpha('remove'))(RocketChatFile.gm(readStream).background('#FFFFFF')).resize(width, `${ height }^`).gravity('Center').crop(width, height).extent(width, height).stream('jpeg').pipe(writeStream);
	},

	avatarsOnValidate(file) {
		if (RocketChatFile.enabled === false || RocketChat.settings.get('Accounts_AvatarResize') !== true) {
			return;
		}

		const tempFilePath = UploadFS.getTempFilePath(file._id);

		const height = RocketChat.settings.get('Accounts_AvatarSize');
		const width = height;
		const future = new Future();

		(file => RocketChat.Info.GraphicsMagick.enabled ? file: file.alpha('remove'))(RocketChatFile.gm(tempFilePath).background('#FFFFFF')).resize(width, `${ height }^`).gravity('Center').crop(width, height).extent(width, height).setFormat('jpeg').write(tempFilePath, Meteor.bindEnvironment(err => {
			if (err != null) {
				console.error(err);
			}
			const size = fs.lstatSync(tempFilePath).size;
			this.getCollection().direct.update({_id: file._id}, {$set: {size}});
			future.return();
		}));
		return future.wait();
	},

	uploadsTransformWrite(readStream, writeStream, fileId, file) {
		if (RocketChatFile.enabled === false || !/^image\/.+/.test(file.type)) {
			return readStream.pipe(writeStream);
		}

		let stream = undefined;

		const identify = function(err, data) {
			if (err) {
				return stream.pipe(writeStream);
			}

			file.identify = {
				format: data.format,
				size: data.size
			};

			if (data.Orientation && !['', 'Unknown', 'Undefined'].includes(data.Orientation)) {
				RocketChatFile.gm(stream).autoOrient().stream().pipe(writeStream);
			} else {
				stream.pipe(writeStream);
			}
		};

		stream = RocketChatFile.gm(readStream).identify(identify).stream();
	},

	uploadsOnValidate(file) {
		if (RocketChatFile.enabled === false || !/^image\/((x-windows-)?bmp|p?jpeg|png)$/.test(file.type)) {
			return;
		}

		const tmpFile = UploadFS.getTempFilePath(file._id);

		const fut = new Future();

		const identify = Meteor.bindEnvironment((err, data) => {
			if (err != null) {
				console.error(err);
				return fut.return();
			}

			file.identify = {
				format: data.format,
				size: data.size
			};

			if ([null, undefined, '', 'Unknown', 'Undefined'].includes(data.Orientation)) {
				return fut.return();
			}

			RocketChatFile.gm(tmpFile).autoOrient().write(tmpFile, Meteor.bindEnvironment((err) => {
				if (err != null) {
					console.error(err);
				}

				const size = fs.lstatSync(tmpFile).size;
				this.getCollection().direct.update({_id: file._id}, {$set: {size}});
				fut.return();
			}));
		});

		RocketChatFile.gm(tmpFile).identify(identify);

		return fut.wait();
	},

	avatarsOnFinishUpload(file) {
		// update file record to match user's username
		const user = RocketChat.models.Users.findOneById(file.userId);
		const oldAvatar = RocketChat.models.Avatars.findOneByName(user.username);
		if (oldAvatar) {
			RocketChat.models.Avatars.deleteFile(oldAvatar._id);
		}
		RocketChat.models.Avatars.updateFileNameById(file._id, user.username);
		// console.log('upload finished ->', file);
	},

	addExtensionTo(file) {
		if (mime.lookup(file.name) === file.type) {
			return file;
		}

		const ext = mime.extension(file.type);
		if (ext && false === new RegExp(`\.${ ext }$`, 'i').test(file.name)) {
			file.name = `${ file.name }.${ ext }`;
		}

		return file;
	},

	getStore(modelName) {
		const storageType = RocketChat.settings.get('FileUpload_Storage_Type');
		const handlerName = `${ storageType }:${ modelName }`;

		return this.getStoreByName(handlerName);
	},

	getStoreByName(handlerName) {
		if (this.handlers[handlerName] == null) {
			console.error(`Upload handler "${ handlerName }" does not exists`);
		}
		return this.handlers[handlerName];
	},

	get(file, req, res, next) {
		const store = this.getStoreByName(file.store);
		if (store && store.get) {
			return store.get(file, req, res, next);
		}
		res.writeHead(404);
		res.end();
	}
});


export class FileUploadClass {
	constructor({ name, model, store, get, insert, getStore }) {
		this.name = name;
		this.model = model || this.getModelFromName();
		this._store = store || UploadFS.getStore(name);
		this.get = get;

		if (insert) {
			this.insert = insert;
		}

		if (getStore) {
			this.getStore = getStore;
		}

		FileUpload.handlers[name] = this;
	}

	getStore() {
		return this._store;
	}

	get store() {
		return this.getStore();
	}

	set store(store) {
		this._store = store;
	}

	getModelFromName() {
		return RocketChat.models[this.name.split(':')[1]];
	}

	delete(fileId) {
		if (this.store && this.store.delete) {
			this.store.delete(fileId);
		}

		return this.model.deleteFile(fileId);
	}

	deleteById(fileId) {
		const file = this.model.findOneById(fileId);

		if (!file) {
			return;
		}

		const store = FileUpload.getStoreByName(file.store);

		return store.delete(file._id);
	}

	deleteByName(fileName) {
		const file = this.model.findOneByName(fileName);

		if (!file) {
			return;
		}

		const store = FileUpload.getStoreByName(file.store);

		return store.delete(file._id);
	}

	insert(fileData, streamOrBuffer, cb) {
		const fileId = this.store.create(fileData);
		const token = this.store.createToken(fileId);
		const tmpFile = UploadFS.getTempFilePath(fileId);

		try {
			if (streamOrBuffer instanceof stream) {
				streamOrBuffer.pipe(fs.createWriteStream(tmpFile));
			} else if (streamOrBuffer instanceof Buffer) {
				fs.writeFileSync(tmpFile, streamOrBuffer);
			} else {
				throw new Error('Invalid file type');
			}

			const file = Meteor.call('ufsComplete', fileId, this.name, token);

			if (cb) {
				cb(null, file);
			}

			return file;
		} catch (e) {
			if (cb) {
				cb(e);
			} else {
				throw e;
			}
		}
	}
}
