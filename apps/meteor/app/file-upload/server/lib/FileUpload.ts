import { Buffer } from 'buffer';
import type { WriteStream } from 'fs';
import fs from 'fs';
import { unlink, rename, writeFile } from 'fs/promises';
import type * as http from 'http';
import type * as https from 'https';
import stream from 'stream';
import URL from 'url';

import { hashLoginToken } from '@rocket.chat/account-utils';
import { Apps, AppEvents } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { isE2EEUpload, type IUpload } from '@rocket.chat/core-typings';
import { Users, Avatars, UserDataFiles, Uploads, Settings, Subscriptions, Messages, Rooms } from '@rocket.chat/models';
import type { NextFunction } from 'connect';
import filesize from 'filesize';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';
import type { ClientSession, OptionalId } from 'mongodb';
import sharp from 'sharp';
import type { WritableStreamBuffer } from 'stream-buffers';
import streamBuffers from 'stream-buffers';

import { streamToBuffer } from './streamToBuffer';
import { i18n } from '../../../../server/lib/i18n';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { UploadFS } from '../../../../server/ufs';
import { ufsComplete } from '../../../../server/ufs/ufs-methods';
import type { Store, StoreOptions } from '../../../../server/ufs/ufs-store';
import { canAccessRoomAsync, canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { settings } from '../../../settings/server';
import { mime } from '../../../utils/lib/mimeTypes';
import { isValidJWT, generateJWT } from '../../../utils/server/lib/JWTHelper';
import { fileUploadIsValidContentType } from '../../../utils/server/restrictions';

const cookie = new Cookies();
let maxFileSize = 0;

settings.watch('FileUpload_MaxFileSize', async (value: string) => {
	try {
		maxFileSize = parseInt(value);
	} catch (e) {
		maxFileSize = (await Settings.findOneById('FileUpload_MaxFileSize'))?.packageValue as number;
	}
});

const handlers: Record<string, FileUploadClass> = {};

const defaults: Record<string, () => Partial<StoreOptions>> = {
	Uploads() {
		return {
			collection: Uploads,
			filter: new UploadFS.Filter({
				onCheck: FileUpload.validateFileUpload,
			}),
			getPath(file: IUpload) {
				return `${settings.get('uniqueID')}/uploads/${file.rid}/${file.userId}/${file._id}`;
			},
			onValidate: FileUpload.uploadsOnValidate,
			async onRead(_fileId: string, file: IUpload, req: http.IncomingMessage, res: http.ServerResponse) {
				// Deprecated: Remove support to usf path
				if (!(await FileUpload.requestCanAccessFiles(req, file))) {
					res.writeHead(403);
					return false;
				}

				res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name || '')}"`);
				return true;
			},
		};
	},

	Avatars() {
		return {
			collection: Avatars,
			filter: new UploadFS.Filter({
				onCheck: FileUpload.validateAvatarUpload,
			}),
			getPath(file: IUpload) {
				const avatarFile = file.rid ? `room-${file.rid}` : file.userId;
				return `${settings.get('uniqueID')}/avatars/${avatarFile}`;
			},
			onValidate: FileUpload.avatarsOnValidate,
			onFinishUpload: FileUpload.avatarsOnFinishUpload,
		};
	},

	UserDataFiles() {
		return {
			collection: UserDataFiles,
			getPath(file: IUpload) {
				return `${settings.get('uniqueID')}/uploads/userData/${file.userId}`;
			},
			onValidate: FileUpload.uploadsOnValidate,
			async onRead(_fileId: string, file: IUpload, req: http.IncomingMessage, res: http.ServerResponse) {
				if (!(await FileUpload.requestCanAccessFiles(req))) {
					res.writeHead(403);
					return false;
				}

				res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name || '')}"`);
				return true;
			},
		};
	},
};

export const FileUpload = {
	handlers,

	getPath(path = '') {
		return `/file-upload/${path}`;
	},

	configureUploadsStore(store: string, name: string, options: any) {
		const type = name.split(':').pop();
		if (!type || !(type in FileUpload.defaults)) {
			throw new Error('Store type undefined');
		}
		const stores = UploadFS.getStores();
		delete stores[name];

		return new UploadFS.store[store](
			Object.assign(
				{
					name,
				},
				options,
				FileUpload.defaults[type](),
			),
		);
	},

	async validateFileUpload(file: IUpload, content?: Buffer) {
		if (!Match.test(file.rid, String)) {
			return false;
		}

		// livechat users can upload files but they don't have an userId
		const user = (file.userId && (await Users.findOne(file.userId))) || undefined;

		const room = await Rooms.findOneById(file.rid);
		if (!room) {
			return false;
		}
		const directMessageAllowed = settings.get('FileUpload_Enabled_Direct');
		const fileUploadAllowed = settings.get('FileUpload_Enabled');
		if (user?.type !== 'app' && (await canAccessRoomAsync(room, user, file)) !== true) {
			return false;
		}
		const language = user?.language || 'en';
		if (!fileUploadAllowed) {
			const reason = i18n.t('FileUpload_Disabled', { lng: language });
			throw new Meteor.Error('error-file-upload-disabled', reason);
		}

		if (!directMessageAllowed && room.t === 'd') {
			const reason = i18n.t('File_not_allowed_direct_messages', { lng: language });
			throw new Meteor.Error('error-direct-message-file-upload-not-allowed', reason);
		}

		// -1 maxFileSize means there is no limit
		if (maxFileSize > -1 && (file.size || 0) > maxFileSize) {
			const reason = i18n.t('File_exceeds_allowed_size_of_bytes', {
				size: filesize(maxFileSize),
				lng: language,
			});
			throw new Meteor.Error('error-file-too-large', reason);
		}

		if (!settings.get('E2E_Enable_Encrypt_Files') && isE2EEUpload(file)) {
			const reason = i18n.t('Encrypted_file_not_allowed', { lng: language });
			throw new Meteor.Error('error-invalid-file-type', reason);
		}

		// E2EE files should be of type application/octet-stream. no information about them should be disclosed on upload if they are encrypted
		if (isE2EEUpload(file)) {
			file.type = 'application/octet-stream';
		}

		// E2EE files are of type application/octet-stream, which is whitelisted for E2EE files
		if (!fileUploadIsValidContentType(file?.type, isE2EEUpload(file) ? 'application/octet-stream' : undefined)) {
			const reason = i18n.t('File_type_is_not_accepted', { lng: language });
			throw new Meteor.Error('error-invalid-file-type', reason);
		}

		// App IPreFileUpload event hook
		try {
			await Apps.self?.triggerEvent(AppEvents.IPreFileUpload, { file, content: content || Buffer.from([]) });
		} catch (error: any) {
			if (error.name === AppsEngineException.name) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}

		return true;
	},

	async validateAvatarUpload(file: IUpload) {
		if (!Match.test(file.rid, String) && !Match.test(file.userId, String)) {
			return false;
		}

		const user = file.uid ? await Users.findOne(file.uid, { projection: { language: 1 } }) : null;
		const language = user?.language || 'en';

		// accept only images
		if (!/^image\//.test(file.type || '')) {
			const reason = i18n.t('File_type_is_not_accepted', { lng: language });
			throw new Meteor.Error('error-invalid-file-type', reason);
		}

		// -1 maxFileSize means there is no limit
		if (maxFileSize > -1 && (file.size || 0) > maxFileSize) {
			const reason = i18n.t('File_exceeds_allowed_size_of_bytes', {
				size: filesize(maxFileSize),
				lng: language,
			});
			throw new Meteor.Error('error-file-too-large', reason);
		}

		return true;
	},

	defaults,

	async avatarsOnValidate(this: Store, file: IUpload, options?: { session?: ClientSession }) {
		if (settings.get('Accounts_AvatarResize') !== true) {
			return;
		}

		const tempFilePath = UploadFS.getTempFilePath(file._id);

		const height = settings.get('Accounts_AvatarSize') as number;
		const width = height as number;

		const s = sharp(tempFilePath);
		if (settings.get('FileUpload_RotateImages') === true) {
			s.rotate();
		}

		const metadata = await s.metadata();
		// if (!metadata) {
		// 	metadata = {};
		// }

		const { data, info } = await s
			.resize({
				width,
				height,
				fit: metadata.hasAlpha ? sharp.fit.contain : sharp.fit.cover,
				background: { r: 255, g: 255, b: 255, alpha: metadata.hasAlpha ? 0 : 1 },
			})
			// Use buffer to get the result in memory then replace the existing file
			// There is no option to override a file using this library
			//
			// BY THE SHARP DOCUMENTATION:
			// toBuffer: Write output to a Buffer. JPEG, PNG, WebP, TIFF and RAW output are supported.
			// By default, the format will match the input image, except GIF and SVG input which become PNG output.
			.toBuffer({ resolveWithObject: true });

		try {
			await writeFile(tempFilePath, data);
		} catch (err: any) {
			SystemLogger.error(err);
		}

		await this.getCollection().updateOne(
			{ _id: file._id },
			{
				$set: {
					size: info.size,
					...(['gif', 'svg'].includes(metadata.format || '') ? { type: 'image/png' } : {}),
				},
			},
			options,
		);
	},

	async resizeImagePreview(fileParam: IUpload) {
		let file = await Uploads.findOneById(fileParam._id);
		if (!file) {
			return;
		}
		file = FileUpload.addExtensionTo(file);
		const image = await FileUpload.getStore('Uploads')._store.getReadStream(file._id, file);

		const transformer = sharp().resize({ width: 32, height: 32, fit: 'inside' }).jpeg().blur();
		const result = transformer.toBuffer().then((out) => out.toString('base64'));
		image.pipe(transformer);
		return result;
	},

	async extractMetadata(file: IUpload) {
		return sharp(await FileUpload.getBuffer(file)).metadata();
	},

	async createImageThumbnail(fileParam: IUpload) {
		if (!settings.get('Message_Attachments_Thumbnails_Enabled')) {
			return;
		}

		const width = settings.get('Message_Attachments_Thumbnails_Width') as number;
		const height = settings.get('Message_Attachments_Thumbnails_Height') as number;

		if (fileParam.identify?.size && fileParam.identify.size.height < height && fileParam.identify?.size.width < width) {
			return;
		}

		let file = await Uploads.findOneById(fileParam._id);
		if (!file) {
			return;
		}

		file = FileUpload.addExtensionTo(file);
		const store = FileUpload.getStore('Uploads');
		const image = await store._store.getReadStream(file._id, file);

		let transformer = sharp().resize({ width, height, fit: 'inside' });

		if (file.type === 'image/svg+xml') {
			transformer = transformer.png();
		}
		const result = transformer.toBuffer({ resolveWithObject: true }).then(({ data, info: { width, height, format } }) => ({
			data,
			width,
			height,
			thumbFileType: (mime.lookup(format) as string) || '',
			thumbFileName: file?.name as string,
			originalFileId: file?._id as string,
		}));
		image.pipe(transformer);

		return result;
	},

	async uploadImageThumbnail(
		{ thumbFileName, thumbFileType, originalFileId }: { thumbFileName: string; thumbFileType: string; originalFileId: string },
		buffer: Buffer,
		rid: string,
		userId: string,
	) {
		const store = FileUpload.getStore('Uploads');
		const details = {
			name: `thumb-${thumbFileName}`,
			size: buffer.length,
			type: thumbFileType,
			originalFileId,
			typeGroup: 'thumb',
			uploadedAt: new Date(),
			_updatedAt: new Date(),
			rid,
			userId,
		};

		return store.insert(details, buffer);
	},

	async uploadsOnValidate(this: Store, file: IUpload, options?: { session?: ClientSession }) {
		if (!file.type || !/^image\/((x-windows-)?bmp|p?jpeg|png|gif|webp)$/.test(file.type)) {
			return;
		}

		const tmpFile = UploadFS.getTempFilePath(file._id);

		const s = sharp(tmpFile);
		const metadata = await s.metadata();
		// if (err != null) {
		// 	SystemLogger.error(err);
		// 	return fut.return();
		// }

		const rotated = typeof metadata.orientation !== 'undefined' && metadata.orientation !== 1;
		const width = rotated ? metadata.height : metadata.width;
		const height = rotated ? metadata.width : metadata.height;

		const identify = {
			format: metadata.format,
			size:
				width != null && height != null
					? {
							width,
							height,
						}
					: undefined,
		};

		const reorientation = async () => {
			if (!rotated || settings.get('FileUpload_RotateImages') !== true) {
				return;
			}

			await s.rotate().toFile(`${tmpFile}.tmp`);

			await unlink(tmpFile);

			await rename(`${tmpFile}.tmp`, tmpFile);
			// SystemLogger.error(err);
		};

		await reorientation();

		const { size } = await fs.lstatSync(tmpFile);
		await this.getCollection().updateOne(
			{ _id: file._id },
			{
				$set: { size, identify },
			},
			options,
		);
	},

	async avatarsOnFinishUpload(file: IUpload) {
		if (file.rid) {
			return;
		}

		if (!file.userId) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed');
		}

		// update file record to match user's username
		const user = await Users.findOneById(file.userId);
		if (!user?.username) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed');
		}
		const oldAvatar = await Avatars.findOneByName(user.username);
		if (oldAvatar) {
			await Avatars.deleteFile(oldAvatar._id);
		}
		await Avatars.updateFileNameById(file._id, user.username);
	},

	async requestCanAccessFiles({ headers = {}, url }: http.IncomingMessage, file?: IUpload) {
		if (!url || !settings.get('FileUpload_ProtectFiles')) {
			return true;
		}

		const { query } = URL.parse(url, true);
		// eslint-disable-next-line @typescript-eslint/naming-convention
		let { rc_uid, rc_token, rc_rid, rc_room_type } = query as Record<string, string | undefined>;
		const { token } = query;

		if (!rc_uid && headers.cookie) {
			rc_uid = cookie.get('rc_uid', headers.cookie);
			rc_token = cookie.get('rc_token', headers.cookie);
			rc_rid = cookie.get('rc_rid', headers.cookie);
			rc_room_type = cookie.get('rc_room_type', headers.cookie);
		}

		const isAuthorizedByRoom = async () =>
			rc_room_type &&
			roomCoordinator
				.getRoomDirectives(rc_room_type)
				.canAccessUploadedFile({ rc_uid: rc_uid || '', rc_rid: rc_rid || '', rc_token: rc_token || '' });

		const isAuthorizedByJWT = () =>
			settings.get('FileUpload_Enable_json_web_token_for_files') &&
			token &&
			isValidJWT(token as string, settings.get('FileUpload_json_web_token_secret_for_files'));

		if ((await isAuthorizedByRoom()) || isAuthorizedByJWT()) {
			return true;
		}

		const uid = rc_uid || (headers['x-user-id'] as string);
		const authToken = rc_token || (headers['x-auth-token'] as string);

		const user = uid && authToken && (await Users.findOneByIdAndLoginToken(uid, hashLoginToken(authToken), { projection: { _id: 1 } }));

		if (!user) {
			return false;
		}

		if (!file?.rid) {
			return true;
		}

		const fileUploadRestrictedToMembers = settings.get<boolean>('FileUpload_Restrict_to_room_members');
		const fileUploadRestrictToUsersWhoCanAccessRoom = settings.get<boolean>('FileUpload_Restrict_to_users_who_can_access_room');

		if (!fileUploadRestrictToUsersWhoCanAccessRoom && !fileUploadRestrictedToMembers) {
			return true;
		}

		if (fileUploadRestrictedToMembers && !fileUploadRestrictToUsersWhoCanAccessRoom) {
			const sub = await Subscriptions.findOneByRoomIdAndUserId(file.rid, user._id, { projection: { _id: 1 } });
			return !!sub;
		}

		if (fileUploadRestrictToUsersWhoCanAccessRoom && !fileUploadRestrictedToMembers) {
			return canAccessRoomIdAsync(file.rid, user._id);
		}

		return false;
	},

	addExtensionTo(file: IUpload) {
		if (mime.lookup(file.name || '') === file.type) {
			return file;
		}

		// This file type can be pretty much anything, so it's better if we don't mess with the file extension
		if (file.type !== 'application/octet-stream') {
			const ext = mime.extension(file.type || '');
			if (ext && new RegExp(`\\.${ext}$`, 'i').test(file.name || '') === false) {
				file.name = `${file.name}.${ext}`;
			}
		}

		return file;
	},

	getStore(modelName: string) {
		const storageType = settings.get('FileUpload_Storage_Type');
		const handlerName = `${storageType}:${modelName}`;

		return this.getStoreByName(handlerName);
	},

	getStoreByName(handlerName?: string) {
		if (!handlerName) {
			SystemLogger.error(`Empty Upload handler does not exists`);
			throw new Error(`Empty Upload handler does not exists`);
		}

		if (this.handlers[handlerName] == null) {
			SystemLogger.error(`Upload handler "${handlerName}" does not exists`);
		}
		return this.handlers[handlerName];
	},

	get(file: IUpload, req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) {
		const store = this.getStoreByName(file.store);
		if (store?.get) {
			return store.get(file, req, res, next);
		}
		res.writeHead(404);
		res.end();
	},

	async getBuffer(file: IUpload): Promise<Buffer> {
		const store = this.getStoreByName(file.store);

		if (!store?.get) {
			throw new Error('Store is invalid');
		}

		const buffer = new streamBuffers.WritableStreamBuffer({
			initialSize: file.size,
		});

		return new Promise((resolve, reject) => {
			buffer.on('finish', () => {
				const contents = buffer.getContents();
				if (contents === false) {
					return reject();
				}
				resolve(contents);
			});

			void store.copy?.(file, buffer);
		});
	},

	async copy(file: IUpload, targetFile: string) {
		const store = this.getStoreByName(file.store);
		const out = fs.createWriteStream(targetFile);

		file = FileUpload.addExtensionTo(file);

		if (store.copy) {
			await store.copy(file, out);
			return true;
		}

		return false;
	},

	redirectToFile(fileUrl: string, _req: http.IncomingMessage, res: http.ServerResponse) {
		res.removeHeader('Content-Length');
		res.removeHeader('Cache-Control');
		res.setHeader('Location', fileUrl);
		res.writeHead(302);
		res.end();
	},

	proxyFile(
		fileName: string,
		fileUrl: string,
		forceDownload: boolean,
		request: typeof http | typeof https,
		_req: http.IncomingMessage,
		res: http.ServerResponse,
	) {
		res.setHeader('Content-Disposition', `${forceDownload ? 'attachment' : 'inline'}; filename="${encodeURI(fileName)}"`);

		request.get(fileUrl, (fileRes) => {
			if (fileRes.statusCode !== 200) {
				res.setHeader('x-rc-proxyfile-status', String(fileRes.statusCode));
				res.setHeader('content-length', 0);
				res.writeHead(500);
				res.end();
				return;
			}

			// eslint-disable-next-line prettier/prettier
			const headersToProxy = ['age', 'cache-control', 'content-length', 'content-type', 'date', 'expired', 'last-modified'];

			headersToProxy.forEach((header) => {
				fileRes.headers[header] && res.setHeader(header, String(fileRes.headers[header]));
			});

			fileRes.pipe(res);
		});
	},

	generateJWTToFileUrls({ rid, userId, fileId }: { rid: string; userId: string; fileId: string }) {
		if (!settings.get('FileUpload_ProtectFiles') || !settings.get('FileUpload_Enable_json_web_token_for_files')) {
			return;
		}
		return generateJWT(
			{
				rid,
				userId,
				fileId,
			},
			settings.get('FileUpload_json_web_token_secret_for_files'),
		);
	},

	async removeFilesByRoomId(rid: string) {
		if (typeof rid !== 'string' || rid.trim().length === 0) {
			return;
		}
		const cursor = Messages.find(
			{
				rid,
				'files._id': {
					$exists: true,
				},
			},
			{
				projection: {
					'files._id': 1,
				},
			},
		);

		for await (const document of cursor) {
			if (document.files) {
				await Promise.all(document.files.map((file) => FileUpload.getStore('Uploads').deleteById(file._id)));
			}
		}
	},
};

type FileUploadClassOptions = {
	name: string;
	model?: typeof Avatars | typeof Uploads | typeof UserDataFiles;
	store?: Store;
	get: (file: IUpload, req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) => Promise<void>;
	insert?: () => Promise<IUpload>;
	getStore?: () => Store;
	copy?: (file: IUpload, out: WriteStream | WritableStreamBuffer) => Promise<void>;
};

export class FileUploadClass {
	public name: FileUploadClassOptions['name'];

	public model: typeof Avatars | typeof Uploads | typeof UserDataFiles;

	public _store: Store;

	public get: FileUploadClassOptions['get'];

	public copy: FileUploadClassOptions['copy'];

	constructor({ name, model, store, get, insert, getStore, copy }: FileUploadClassOptions) {
		this.name = name;
		this.model = model || this.getModelFromName();
		this._store = store || UploadFS.getStore(name);
		this.get = get;
		this.copy = copy;

		if (insert) {
			this.insert = insert;
		}

		if (getStore) {
			this.getStore = getStore;
		}

		FileUpload.handlers[name] = this;
	}

	getStore() {
		return this._store;
	}

	get store() {
		return this.getStore();
	}

	set store(store) {
		this._store = store;
	}

	getModelFromName(): typeof this.model {
		const modelsAvailable: Record<string, typeof this.model> = {
			Avatars,
			Uploads,
			UserDataFiles,
		};
		const modelName = this.name.split(':')[1];
		if (!modelsAvailable[modelName]) {
			throw new Error('Invalid Model for FileUpload');
		}
		return modelsAvailable[modelName];
	}

	async delete(fileId: string, options?: { session?: ClientSession }) {
		// TODO: Remove this method
		if (this.store?.delete) {
			await this.store.delete(fileId, { session: options?.session });
		}

		return this.model.deleteFile(fileId, { session: options?.session });
	}

	async deleteById(fileId: string) {
		const file = await this.model.findOneById(fileId);

		if (!file) {
			return;
		}

		const store = FileUpload.getStoreByName(file.store);

		return store.delete(file._id);
	}

	async deleteByName(fileName: string, options?: { session?: ClientSession }) {
		const file = await this.model.findOneByName(fileName, { session: options?.session });

		if (!file) {
			return;
		}

		const store = FileUpload.getStoreByName(file.store);

		return store.delete(file._id);
	}

	async deleteByRoomId(rid: string) {
		const file = await this.model.findOneByRoomId(rid);

		if (!file) {
			return;
		}

		const store = FileUpload.getStoreByName(file.store);

		return store.delete(file._id);
	}

	async _doInsert(
		fileData: OptionalId<IUpload>,
		streamOrBuffer: ReadableStream | stream | Buffer,
		options?: { session?: ClientSession },
	): Promise<IUpload> {
		const fileId = await this.store.create(fileData, { session: options?.session });
		const tmpFile = UploadFS.getTempFilePath(fileId);

		try {
			if (streamOrBuffer instanceof stream) {
				streamOrBuffer.pipe(fs.createWriteStream(tmpFile));
			} else if (streamOrBuffer instanceof Buffer) {
				fs.writeFileSync(tmpFile, streamOrBuffer);
			} else {
				throw new Error('Invalid file type');
			}

			const file = await ufsComplete(fileId, this.name, { session: options?.session });

			return file;
		} catch (e: any) {
			throw e;
		}
	}

	async insert(
		fileData: OptionalId<IUpload>,
		streamOrBuffer: ReadableStream | stream.Readable | Buffer,
		options?: { session?: ClientSession },
	) {
		if (streamOrBuffer instanceof stream) {
			streamOrBuffer = await streamToBuffer(streamOrBuffer);
		}

		if (streamOrBuffer instanceof Uint8Array) {
			// Services compat :)
			streamOrBuffer = Buffer.from(streamOrBuffer);
		}

		// Check if the fileData matches store filter
		const filter = this.store.getFilter();
		if (filter?.check) {
			await filter.check(fileData, streamOrBuffer);
		}

		return this._doInsert(fileData, streamOrBuffer, { session: options?.session });
	}
}
