import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { RocketChatFile } from '../../../file/server';
import { settings } from '../../../settings/server';

export let RocketChatFileCustomSoundsInstance;

Meteor.startup(() => {
	let storeType = 'GridFS';

	if (settings.get('CustomSounds_Storage_Type')) {
		storeType = settings.get('CustomSounds_Storage_Type');
	}

	const RocketChatStore = RocketChatFile[storeType];

	if (RocketChatStore == null) {
		throw new Error(`Invalid RocketChatStore type [${storeType}]`);
	}

	SystemLogger.info(`Using ${storeType} for custom sounds storage`);

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

	return WebApp.connectHandlers.use('/custom-sounds/', async (req, res /* , next*/) => {
		const fileId = decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, ''));

		if (!fileId) {
			res.writeHead(403);
			res.write('Forbidden');
			res.end();
			return;
		}

		const file = await RocketChatFileCustomSoundsInstance.getFileWithReadStream(fileId);
		if (!file) {
			res.writeHead(404);
			res.write('Not found');
			res.end();
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
		res.setHeader('Content-Type', file.contentType);
		res.setHeader('Content-Length', file.length);

		file.readStream.pipe(res);
	});
});
