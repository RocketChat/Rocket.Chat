/* globals FileUpload:true */
FileUpload.handlers = {};

FileUpload.addHandler = function(store, handler) {
	this.handlers[store] = handler;
};

FileUpload.delete = function(fileId) {
	let file = RocketChat.models.Uploads.findOneById(fileId);

	if (!file) {
		return;
	}

	this.handlers[file.store].delete(file);

	return RocketChat.models.Uploads.remove(file._id);
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

FileUpload.mime2ext = function(mimetype) {
	const m2e = {
		'audio/wav': '.wav',
		'image/bmp': '.bmp',
		'image/gif': '.gif',
		'image/jpeg': '.jpg',
		'image/png': '.png',
		'text/css': '.css',
		'text/html': '.html',
		'text/plain': '.txt'
	};
	return m2e[mimetype] || '';
};
