/* globals FileUploadBase:true */
/* exported FileUploadBase */

FileUploadBase = class FileUploadBase {
	constructor(meta, file/*, data*/) {
		this.id = Random.id();
		this.meta = meta;
		this.file = file;
	}

	getProgress() {

	}

	getFileName() {
		return this.meta.name;
	}

	start() {

	}

	stop() {

	}
};
