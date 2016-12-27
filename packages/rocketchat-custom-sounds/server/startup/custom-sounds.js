/* globals isSetNotNull */
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

		let file = self.RocketChatFileCustomSoundsInstance.getFileWithReadStream(encodeURIComponent(params.sound));

		res.setHeader('Content-Disposition', 'inline');

		if (!isSetNotNull(() => file)) {
			//use code from username initials renderer until file upload is complete
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=0');
			res.setHeader('Expires', '-1');
			res.setHeader('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT');

			let reqModifiedHeader = req.headers['if-modified-since'];
			if (reqModifiedHeader != null) {
				if (reqModifiedHeader === 'Thu, 01 Jan 2015 00:00:00 GMT') {
					res.writeHead(304);
					res.end();
					return;
				}
			}

			let color = '#000';
			let initials = '?';

			let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" pointer-events="none" width="50" height="50" style="width: 50px; height: 50px; background-color: ${color};">
	<text text-anchor="middle" y="50%" x="50%" dy="0.36em" pointer-events="auto" fill="#ffffff" font-family="Helvetica, Arial, Lucida Grande, sans-serif" style="font-weight: 400; font-size: 28px;">
		${initials}
	</text>
</svg>`;

			res.write(svg);
			res.end();
			return;
		}

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
