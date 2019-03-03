import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { RocketChatFile } from 'meteor/rocketchat:file';
import { settings } from 'meteor/rocketchat:settings';
import _ from 'underscore';

export let RocketChatFileCustomSoundsInstance;

Meteor.startup(function() {
	let storeType = 'GridFS';

	if (settings.get('CustomSounds_Storage_Type')) {
		storeType = settings.get('CustomSounds_Storage_Type');
	}

	const RocketChatStore = RocketChatFile[storeType];

	if (RocketChatStore == null) {
		throw new Error(`Invalid RocketChatStore type [${ storeType }]`);
	}

	console.log(`Using ${ storeType } for custom sounds storage`.green);

	let path = '~/uploads';
	if (settings.get('CustomSounds_FileSystemPath') != null) {
		if (settings.get('CustomSounds_FileSystemPath').trim() !== '') {
			path = settings.get('CustomSounds_FileSystemPath');
		}
	}

	RocketChatFileCustomSoundsInstance = new RocketChatStore({
		name: 'custom_sounds',
		absolutePath: path,
	});

	return WebApp.connectHandlers.use('/custom-sounds/', Meteor.bindEnvironment(function(req, res/* , next*/) {
		const params =
			{ sound: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')) };

		if (_.isEmpty(params.sound)) {
			res.writeHead(403);
			res.write('Forbidden');
			res.end();
			return;
		}

		const file = RocketChatFileCustomSoundsInstance.getFileWithReadStream(params.sound);
		if (!file) {
			return;
		}

		res.setHeader('Content-Disposition', 'inline');

		let fileUploadDate = undefined;
		if (file.uploadDate != null) {
			fileUploadDate = file.uploadDate.toUTCString();
		}

		const reqModifiedHeader = req.headers['if-modified-since'];
		if (reqModifiedHeader != null) {
			if (reqModifiedHeader === fileUploadDate) {
				res.setHeader('Last-Modified', reqModifiedHeader);
				res.writeHead(304);
				res.end();
				return;
			}
		}

		res.setHeader('Cache-Control', 'public, max-age=0');
		res.setHeader('Expires', '-1');
		if (fileUploadDate != null) {
			res.setHeader('Last-Modified', fileUploadDate);
		} else {
			res.setHeader('Last-Modified', new Date().toUTCString());
		}
		res.setHeader('Content-Type', 'audio/mpeg');
		res.setHeader('Content-Length', file.length);

		file.readStream.pipe(res);
	}));
});
