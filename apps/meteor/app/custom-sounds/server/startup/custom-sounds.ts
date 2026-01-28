import type { IncomingMessage, ServerResponse } from 'http';

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { RocketChatFile } from '../../../file/server';
import { settings } from '../../../settings/server';

export let RocketChatFileCustomSoundsInstance: InstanceType<typeof RocketChatFile.GridFS | typeof RocketChatFile.FileSystem>;

Meteor.startup(() => {
	let storeType: 'GridFS' | 'FileSystem' = 'GridFS';

	if (settings.get<'GridFS' | 'FileSystem'>('CustomSounds_Storage_Type')) {
		storeType = settings.get<'GridFS' | 'FileSystem'>('CustomSounds_Storage_Type');
	}

	const RocketChatStore = RocketChatFile[storeType];

	if (RocketChatStore == null) {
		throw new Error(`Invalid RocketChatStore type [${storeType}]`);
	}

	SystemLogger.info({
		msg: 'Using custom sounds storage',
		storeType,
	});

	let path = '~/uploads';
	if (settings.get<string>('CustomSounds_FileSystemPath') != null) {
		const filePath = settings.get<string>('CustomSounds_FileSystemPath');
		if (typeof filePath === 'string' && filePath.trim() !== '') {
			path = filePath;
		}
	}

	RocketChatFileCustomSoundsInstance = new RocketChatStore({
		name: 'custom_sounds',
		absolutePath: path,
	});

	return WebApp.connectHandlers.use('/custom-sounds/', async (req: IncomingMessage, res: ServerResponse /* , next*/) => {
		const fileId = decodeURIComponent(req.url?.replace(/^\//, '').replace(/\?.*$/, '') || '');

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

		let fileUploadDate: string | undefined = undefined;
		if ('uploadDate' in file && file.uploadDate != null) {
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

		res.setHeader('Content-Type', file.contentType!);
		res.setHeader('Content-Length', file.length);

		file.readStream.pipe(res);
	});
});
