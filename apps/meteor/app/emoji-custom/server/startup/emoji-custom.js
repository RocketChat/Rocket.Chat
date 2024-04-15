import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { RocketChatFile } from '../../../file/server';
import { settings } from '../../../settings/server';

export let RocketChatFileEmojiCustomInstance;

Meteor.startup(() => {
	let storeType = 'GridFS';

	if (settings.get('EmojiUpload_Storage_Type')) {
		storeType = settings.get('EmojiUpload_Storage_Type');
	}

	const RocketChatStore = RocketChatFile[storeType];

	if (RocketChatStore == null) {
		throw new Error(`Invalid RocketChatStore type [${storeType}]`);
	}

	SystemLogger.info(`Using ${storeType} for custom emoji storage`);

	let path = '~/uploads';
	if (settings.get('EmojiUpload_FileSystemPath') != null) {
		if (settings.get('EmojiUpload_FileSystemPath').trim() !== '') {
			path = settings.get('EmojiUpload_FileSystemPath');
		}
	}

	RocketChatFileEmojiCustomInstance = new RocketChatStore({
		name: 'custom_emoji',
		absolutePath: path,
	});

	return WebApp.connectHandlers.use('/emoji-custom/', async (req, res /* , next*/) => {
		const params = { emoji: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')) };

		if (params.emoji === '') {
			res.writeHead(403);
			res.write('Forbidden');
			res.end();
			return;
		}

		const file = await RocketChatFileEmojiCustomInstance.getFileWithReadStream(encodeURIComponent(params.emoji));

		res.setHeader('Content-Disposition', 'inline');

		if (!file) {
			// use code from username initials renderer until file upload is complete
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=0');
			res.setHeader('Expires', '-1');
			res.setHeader('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT');

			const reqModifiedHeader = req.headers['if-modified-since'];
			if (reqModifiedHeader != null) {
				if (reqModifiedHeader === 'Thu, 01 Jan 2015 00:00:00 GMT') {
					res.writeHead(304);
					res.end();
					return;
				}
			}

			const color = '#000';
			const initials = '?';

			const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" pointer-events="none" width="50" height="50" style="width: 50px; height: 50px; background-color: ${color};">
	<text text-anchor="middle" y="50%" x="50%" dy="0.36em" pointer-events="auto" fill="#ffffff" font-family="Helvetica, Arial, Lucida Grande, sans-serif" style="font-weight: 400; font-size: 28px;">
		${initials}
	</text>
</svg>`;

			res.write(svg);
			res.end();
			return;
		}

		const fileUploadDate = file.uploadDate != null ? file.uploadDate.toUTCString() : undefined;

		const reqModifiedHeader = req.headers['if-modified-since'];
		if (reqModifiedHeader != null && reqModifiedHeader === fileUploadDate) {
			res.setHeader('Last-Modified', reqModifiedHeader);
			res.writeHead(304);
			res.end();
			return;
		}

		res.setHeader('Cache-Control', 'public, max-age=31536000');
		res.setHeader('Last-Modified', fileUploadDate || new Date().toUTCString());
		res.setHeader('Content-Length', file.length);

		if (/^svg$/i.test(params.emoji.split('.').pop())) {
			res.setHeader('Content-Type', 'image/svg+xml');
		} else if (/^png$/i.test(params.emoji.split('.').pop())) {
			res.setHeader('Content-Type', 'image/png');
		} else {
			res.setHeader('Content-Type', 'image/jpeg');
		}

		file.readStream.pipe(res);
	});
});
