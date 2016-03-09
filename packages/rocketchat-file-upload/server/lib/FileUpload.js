/* globals FileUpload:true */
FileUpload = {
	handlers: {},
	addHandler(store, handler) {
		this.handlers[store] = handler;
	},
	delete(fileId) {
		let file = RocketChat.models.Uploads.findOneById(fileId);

		if (!file) {
			return;
		}

		this.handlers[file.store].delete(file);

		return RocketChat.models.Uploads.remove(file._id);
	},
	get(file, req, res, next) {
		if (file.store && this.handlers && this.handlers[file.store] && this.handlers[file.store].get) {
			this.handlers[file.store].get.call(this, file, req, res, next);
		} else {
			res.writeHead(404);
			res.end();
			return;
		}
	}
};
