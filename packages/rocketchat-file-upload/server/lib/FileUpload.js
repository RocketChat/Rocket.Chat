import mime from 'mime-type/with-db';

Object.assign(FileUpload, {
	handlers: {},

	avatarTransformWrite(readStream, writeStream/*, fileId, file*/) {
		if (RocketChatFile.enabled === false || RocketChat.settings.get('Accounts_AvatarResize') !== true) {
			return readStream.pipe(writeStream);
		}
		const height = RocketChat.settings.get('Accounts_AvatarSize');
		const width = height;
		return RocketChatFile.gm(readStream).background('#ffffff').resize(width, `${ height }^`).gravity('Center').crop(width, height).extent(width, height).stream('jpeg').pipe(writeStream);
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

		if (this.handlers[handlerName] == null) {
			console.error(`Upload handler "${ handlerName }" does not exists`);
		}

		return this.handlers[handlerName];
	},

	get(file, req, res, next) {
		if (file.store && this.handlers && this.handlers[file.store] && this.handlers[file.store].get) {
			this.handlers[file.store].get(file, req, res, next);
		} else {
			res.writeHead(404);
			res.end();
			return;
		}
	}
});


export class FileUploadClass {
	constructor({ name, model, store, get, insert, getStore }) {
		this.name = name;
		this.model = model || this.getModelFromName();
		this._store = store;
		this.get = get;
		this.insert = insert;

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

		return this.delete(file._id);
	}

	deleteByName(fileName) {
		const file = this.model.findOneByName(fileName);

		if (!file) {
			return;
		}

		return this.delete(file._id);
	}
}
