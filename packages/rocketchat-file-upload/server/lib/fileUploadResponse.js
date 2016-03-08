fileUploadResponse = new class {
	constructor() {
		this.workers = {};
	}
	register(store, callback) {
		this.workers[store] = callback;
	}
	process(file, req, res, next) {
		if (file.store && this.workers && this.workers[file.store]) {
			this.workers[file.store].call(this, file, req, res, next);
		} else {
			res.writeHead(404);
			res.end();
			return;
		}
	}
};
