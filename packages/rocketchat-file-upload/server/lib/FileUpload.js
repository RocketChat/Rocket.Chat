/* globals FileUpload:true */
import mime from 'mime-type/with-db';

FileUpload.handlers = {};

FileUpload.addHandler = function(store, handler) {
	this.handlers[store] = handler;
};

FileUpload.delete = function(fileId) {
	const file = RocketChat.models.Uploads.findOneById(fileId);

	if (!file) {
		return;
	}

	this.handlers[file.store].delete(file);

	return RocketChat.models.Uploads.deleteFile(file._id);
};

FileUpload.get = function(file, req, res, next) {
	if (file.store && this.handlers && this.handlers[file.store] && this.handlers[file.store].get) {
		this.handlers[file.store].get.call(this, file, req, res, next);
	} else {
		res.writeHead(404);
		res.end();
		return;
	}
};

FileUpload.addExtensionTo = function(file) {
	if (mime.lookup(file.name) === file.type) {
		return file;
	}

	const ext = mime.extension(file.type);
	if (ext && false === new RegExp(`\.${ ext }$`, 'i').test(file.name)) {
		file.name = `${ file.name }.${ ext }`;
	}

	return file;
};

FileUpload.avatarTransformWrite = function(readStream, writeStream, fileId, file) {
	if (RocketChatFile.enabled === false || RocketChat.settings.get('Accounts_AvatarResize') !== true) {
		return readStream.pipe(writeStream);
	}
	const height = RocketChat.settings.get('Accounts_AvatarSize');
	const width = height;
	return RocketChatFile.gm(readStream).background('#ffffff').resize(width, `${ height }^`).gravity('Center').crop(width, height).extent(width, height).stream('jpeg').pipe(writeStream);
};

