import stream from 'stream';
import fs from 'fs';
import path from 'path';

import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import mkdirp from 'mkdirp';

const mongo = MongoInternals.NpmModule;
const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

const RocketChatFile = {};

RocketChatFile.bufferToStream = function (buffer) {
	const bufferStream = new stream.PassThrough();
	bufferStream.end(buffer);
	return bufferStream;
};

RocketChatFile.dataURIParse = function (dataURI) {
	const imageData = dataURI.split(';base64,');
	return {
		image: imageData[1],
		contentType: imageData[0].replace('data:', ''),
	};
};

RocketChatFile.addPassThrough = function (st, fn) {
	const pass = new stream.PassThrough();
	fn(pass, st);
	return pass;
};

RocketChatFile.GridFS = class {
	constructor(config = {}) {
		const { name = 'file', transformWrite } = config;

		this.name = name;
		this.transformWrite = transformWrite;

		this.bucket = new mongo.GridFSBucket(db, { bucketName: this.name });

		this.getFileSync = Meteor.wrapAsync(this.getFile.bind(this));
	}

	findOne(filename) {
		const file = Promise.await(this.bucket.find({ filename }).limit(1).toArray());
		if (!file) {
			return;
		}
		return file[0];
	}

	remove(fileId) {
		Promise.await(this.bucket.delete(fileId));
	}

	createWriteStream(fileName, contentType) {
		const self = this;
		let ws = this.bucket.openUploadStream(fileName, {
			contentType,
		});

		if (self.transformWrite != null) {
			ws = RocketChatFile.addPassThrough(ws, function (rs, ws) {
				const file = {
					name: self.name,
					fileName,
					contentType,
				};
				return self.transformWrite(file, rs, ws);
			});
		}
		ws.on('close', function () {
			return ws.emit('end');
		});
		return ws;
	}

	createReadStream(fileName) {
		return this.bucket.openDownloadStreamByName(fileName);
	}

	getFileWithReadStream(fileName) {
		const file = this.findOne(fileName);
		if (file == null) {
			return null;
		}
		const rs = this.createReadStream(fileName);
		return {
			readStream: rs,
			contentType: file.contentType,
			length: file.length,
			uploadDate: file.uploadDate,
		};
	}

	getFile(fileName, cb) {
		const file = this.getFileWithReadStream(fileName);
		if (!file) {
			return cb();
		}
		const data = [];
		file.readStream.on(
			'data',
			Meteor.bindEnvironment(function (chunk) {
				return data.push(chunk);
			}),
		);
		return file.readStream.on(
			'end',
			Meteor.bindEnvironment(function () {
				return cb(null, {
					buffer: Buffer.concat(data),
					contentType: file.contentType,
					length: file.length,
					uploadDate: file.uploadDate,
				});
			}),
		);
	}

	deleteFile(fileName) {
		const file = this.findOne(fileName);
		if (file == null) {
			return undefined;
		}
		return this.remove(file._id);
	}
};

RocketChatFile.FileSystem = class {
	constructor(config = {}) {
		let { absolutePath = '~/uploads' } = config;
		const { transformWrite } = config;

		this.transformWrite = transformWrite;
		if (absolutePath.split(path.sep)[0] === '~') {
			const homepath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
			if (homepath != null) {
				absolutePath = absolutePath.replace('~', homepath);
			} else {
				throw new Error('Unable to resolve "~" in path');
			}
		}
		this.absolutePath = path.resolve(absolutePath);
		mkdirp.sync(this.absolutePath);
		this.statSync = Meteor.wrapAsync(fs.stat.bind(fs));
		this.unlinkSync = Meteor.wrapAsync(fs.unlink.bind(fs));
		this.getFileSync = Meteor.wrapAsync(this.getFile.bind(this));
	}

	createWriteStream(fileName, contentType) {
		const self = this;
		let ws = fs.createWriteStream(path.join(this.absolutePath, fileName));
		if (self.transformWrite != null) {
			ws = RocketChatFile.addPassThrough(ws, function (rs, ws) {
				const file = {
					fileName,
					contentType,
				};
				return self.transformWrite(file, rs, ws);
			});
		}
		ws.on('close', function () {
			return ws.emit('end');
		});
		return ws;
	}

	createReadStream(fileName) {
		return fs.createReadStream(path.join(this.absolutePath, fileName));
	}

	stat(fileName) {
		return this.statSync(path.join(this.absolutePath, fileName));
	}

	remove(fileName) {
		return this.unlinkSync(path.join(this.absolutePath, fileName));
	}

	getFileWithReadStream(fileName) {
		try {
			const stat = this.stat(fileName);
			const rs = this.createReadStream(fileName);
			return {
				readStream: rs,
				// contentType: file.contentType
				length: stat.size,
			};
		} catch (error1) {
			return null;
		}
	}

	getFile(fileName, cb) {
		const file = this.getFileWithReadStream(fileName);
		if (!file) {
			return cb();
		}
		const data = [];
		file.readStream.on(
			'data',
			Meteor.bindEnvironment(function (chunk) {
				return data.push(chunk);
			}),
		);
		return file.readStream.on(
			'end',
			Meteor.bindEnvironment(function () {
				return {
					buffer: Buffer.concat(data)({
						contentType: file.contentType,
						length: file.length,
						uploadDate: file.uploadDate,
					}),
				};
			}),
		);
	}

	deleteFile(fileName) {
		try {
			return this.remove(fileName);
		} catch (error1) {
			return null;
		}
	}
};

export { RocketChatFile };
