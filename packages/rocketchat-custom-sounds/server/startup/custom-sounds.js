/* globals isSetNotNull, RocketChatFileCustomSoundsInstance */
Meteor.startup(function() {
	let storeType = 'GridFS';

	if (RocketChat.settings.get('CustomSounds_Storage_Type')) {
		storeType = RocketChat.settings.get('CustomSounds_Storage_Type');
	}

	let RocketChatStore = RocketChatFile[storeType];

	if (!isSetNotNull(() => RocketChatStore)) {
		throw new Error(`Invalid RocketChatStore type [${storeType}]`);
	}

	console.log(`Using ${storeType} for custom sounds storage`.green);

	let path = '~/uploads';
	if (isSetNotNull(() => RocketChat.settings.get('CustomSounds_FileSystemPath'))) {
		if (RocketChat.settings.get('CustomSounds_FileSystemPath').trim() !== '') {
			path = RocketChat.settings.get('CustomSounds_FileSystemPath');
		}
	}

	this.RocketChatFileCustomSoundsInstance = new RocketChatStore({
		name: 'custom_sounds',
		absolutePath: path
	});

	self = this;

	return WebApp.connectHandlers.use('/custom-sounds/', Meteor.bindEnvironment(function(req, res/*, next*/) {
		let params =
			{ sound: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')) };

		if (_.isEmpty(params.sound)) {
			res.writeHead(403);
			res.write('Forbidden');
			res.end();
			return;
		}

		let file = RocketChatFileCustomSoundsInstance.getFileWithReadStream(params.sound);
		if (!file) {
			return;
		}

		res.setHeader('Content-Disposition', 'inline');

		let fileUploadDate = undefined;
		if (isSetNotNull(() => file.uploadDate)) {
			fileUploadDate = file.uploadDate.toUTCString();
		}

		let reqModifiedHeader = req.headers['if-modified-since'];
		if (isSetNotNull(() => reqModifiedHeader)) {
			if (reqModifiedHeader === fileUploadDate) {
				res.setHeader('Last-Modified', reqModifiedHeader);
				res.writeHead(304);
				res.end();
				return;
			}
		}

		res.setHeader('Cache-Control', 'public, max-age=0');
		res.setHeader('Expires', '-1');
		if (isSetNotNull(() => fileUploadDate)) {
			res.setHeader('Last-Modified', fileUploadDate);
		} else {
			res.setHeader('Last-Modified', new Date().toUTCString());
		}
		res.setHeader('Content-Type', 'audio/mpeg');
		res.setHeader('Content-Length', file.length);

		file.readStream.pipe(res);
	}));
});
