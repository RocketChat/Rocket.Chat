import type { IncomingMessage, ServerResponse } from 'node:http';

import { CustomSounds } from '@rocket.chat/models';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../../../settings';
import { SystemLogger } from '../../../logger/system';
import { RocketChatFile } from '../../file';

type RocketChatFileStore = InstanceType<(typeof RocketChatFile)['GridFS' | 'FileSystem']>;

export let RocketChatFileCustomSoundsInstance: RocketChatFileStore;

const initializeCustomSoundsStorage = () => {
	let storeType: 'GridFS' | 'FileSystem' = 'GridFS';

	if (settings.get('CustomSounds_Storage_Type')) {
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
	const customPath = settings.get<string | undefined>('CustomSounds_FileSystemPath');
	if (customPath != null && customPath.trim() !== '') {
		path = customPath;
	}

	RocketChatFileCustomSoundsInstance = new RocketChatStore({
		name: 'custom_sounds',
		absolutePath: path,
	});
};

WebApp.connectHandlers.use('/custom-sounds/', async (req: IncomingMessage, res: ServerResponse /* , next*/) => {
	const fileId = decodeURIComponent((req.url ?? '').replace(/^\//, '').replace(/\?.*$/, ''));

	if (!fileId) {
		res.writeHead(403);
		res.write('Forbidden');
		res.end();
		return;
	}

	const sound = await CustomSounds.findOneById(fileId.split('.')[0], { projection: { _id: 1 } });

	if (!sound) {
		res.writeHead(404);
		res.write('Not found');
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

	res.setHeader('Content-Type', file.contentType ?? 'application/octet-stream');
	res.setHeader('Content-Length', file.length);

	file.readStream.pipe(res);
});

settings.watchMultiple(['CustomSounds_Storage_Type', 'CustomSounds_FileSystemPath'], initializeCustomSoundsStorage);
