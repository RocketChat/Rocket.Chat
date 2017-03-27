

const Grid = Npm.require('gridfs-stream');

const stream = Npm.require('stream');

const fs = Npm.require('fs');

const path = Npm.require('path');

const mkdirp = Npm.require('mkdirp');

const gm = Npm.require('gm');

const exec = Npm.require('child_process').exec;

Grid.tryParseObjectId = function() {
	return false;
};
//TODO: REMOVE RocketChatFile from globals
RocketChatFile = {
	gm,
	enabled: undefined,
	enable() {
		RocketChatFile.enabled = true;
		return RocketChat.settings.updateOptionsById('Accounts_AvatarResize', {
			alert: undefined
		});
	},
	disable() {
		RocketChatFile.enabled = false;
		return RocketChat.settings.updateOptionsById('Accounts_AvatarResize', {
			alert: 'The_image_resize_will_not_work_because_we_can_not_detect_ImageMagick_or_GraphicsMagick_installed_in_your_server'
		});
	}
};

const detectGM = function() {
	return exec('gm version', Meteor.bindEnvironment(function(error, stdout) {
		if ((error == null) && stdout.indexOf('GraphicsMagick') > -1) {
			RocketChatFile.enable();
			RocketChat.Info.GraphicsMagick = {
				enabled: true,
				version: stdout
			};
		} else {
			RocketChat.Info.GraphicsMagick = {
				enabled: false
			};
		}
		return exec('convert -version', Meteor.bindEnvironment(function(error, stdout) {
			if ((error == null) && stdout.indexOf('ImageMagick') > -1) {
				if (RocketChatFile.enabled !== true) {
					RocketChatFile.gm = RocketChatFile.gm.subClass({
						imageMagick: true
					});
					RocketChatFile.enable();
				}
				return RocketChat.Info.ImageMagick = {
					enabled: true,
					version: stdout
				};
			} else {
				if (RocketChatFile.enabled !== true) {
					RocketChatFile.disable();
				}
				return RocketChat.Info.ImageMagick = {
					enabled: false
				};
			}
		}));
	}));
};

detectGM();

Meteor.methods({
	'detectGM'() {
		detectGM();
	}
});

RocketChatFile.bufferToStream = function(buffer) {
	const bufferStream = new stream.PassThrough();
	bufferStream.end(buffer);
	return bufferStream;
};

RocketChatFile.dataURIParse = function(dataURI) {
	const imageData = dataURI.split(';base64,');
	return {
		image: imageData[1],
		contentType: imageData[0].replace('data:', '')
	};
};

RocketChatFile.addPassThrough = function(st, fn) {
	const pass = new stream.PassThrough();
	fn(pass, st);
	return pass;
};

RocketChatFile.GridFS = class {
	constructor(config) {
		if (config == null) {
			config = {};
		}
		let name = config.name;
		const transformWrite = config.transformWrite;
		if (name == null) {
			name = 'file';
		}
		this.name = name;
		this.transformWrite = transformWrite;
		const mongo = Package.mongo.MongoInternals.NpmModule;
		const db = Package.mongo.MongoInternals.defaultRemoteCollectionDriver().mongo.db;
		this.store = new Grid(db, mongo);
		this.findOneSync = Meteor.wrapAsync(this.store.collection(this.name).findOne.bind(this.store.collection(this.name)));
		this.removeSync = Meteor.wrapAsync(this.store.remove.bind(this.store));
		this.getFileSync = Meteor.wrapAsync(this.getFile.bind(this));
	}

	findOne(fileName) {
		return this.findOneSync({
			_id: fileName
		});
	}

	remove(fileName) {
		return this.removeSync({
			_id: fileName,
			root: this.name
		});
	}

	createWriteStream(fileName, contentType) {
		const self = this;
		let ws = this.store.createWriteStream({
			_id: fileName,
			filename: fileName,
			mode: 'w',
			root: this.name,
			content_type: contentType
		});
		if (self.transformWrite != null) {
			ws = RocketChatFile.addPassThrough(ws, function(rs, ws) {
				const file = {
					name: self.name,
					fileName,
					contentType
				};
				return self.transformWrite(file, rs, ws);
			});
		}
		ws.on('close', function() {
			return ws.emit('end');
		});
		return ws;
	}

	createReadStream(fileName) {
		return this.store.createReadStream({
			_id: fileName,
			root: this.name
		});
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
			uploadDate: file.uploadDate
		};
	}

	getFile(fileName, cb) {
		const file = this.getFileWithReadStream(fileName);
		if (!file) {
			return cb();
		}
		const data = [];
		file.readStream.on('data', Meteor.bindEnvironment(function(chunk) {
			return data.push(chunk);
		}));
		return file.readStream.on('end', Meteor.bindEnvironment(function() {
			return cb(null, {
				buffer: Buffer.concat(data),
				contentType: file.contentType,
				length: file.length,
				uploadDate: file.uploadDate
			});
		}));
	}

	deleteFile(fileName) {
		const file = this.findOne(fileName);
		if (file == null) {
			return null;
		}
		return this.remove(fileName);
	}


};

RocketChatFile.FileSystem = class {
	constructor(config) {
		if (config == null) {
			config = {};
		}
		let absolutePath = config.absolutePath;
		const transformWrite = config.transformWrite;
		if (absolutePath == null) {
			absolutePath = '~/uploads';
		}
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
			ws = RocketChatFile.addPassThrough(ws, function(rs, ws) {
				const file = {
					fileName,
					contentType
				};
				return self.transformWrite(file, rs, ws);
			});
		}
		ws.on('close', function() {
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
				length: stat.size
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
		file.readStream.on('data', Meteor.bindEnvironment(function(chunk) {
			return data.push(chunk);
		}));
		return file.readStream.on('end', Meteor.bindEnvironment(function() {
			return {
				buffer: Buffer.concat(data)({
					contentType: file.contentType,
					length: file.length,
					uploadDate: file.uploadDate
				})
			};
		}));
	}

	deleteFile(fileName) {
		try {
			return this.remove(fileName);
		} catch (error1) {
			return null;
		}
	}
};
