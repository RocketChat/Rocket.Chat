import fs from 'fs';
import stream from 'stream';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import streamBuffers from 'stream-buffers';
import Future from 'fibers/future';
import sharp from 'sharp';
import { Cookies } from 'meteor/ostrio:cookies';
import { UploadFS } from 'meteor/jalik:ufs';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import filesize from 'filesize';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Avatars, UserDataFiles, Uploads, Settings } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import Users from '../../../models/server/models/Users';
import Rooms from '../../../models/server/models/Rooms';
import { mime } from '../../../utils/lib/mimeTypes';
import { hasPermission } from '../../../authorization/server/functions/hasPermission';
import { canAccessRoom } from '../../../authorization/server/functions/canAccessRoom';
import { fileUploadIsValidContentType } from '../../../utils/lib/fileUploadRestrictions';
import { isValidJWT, generateJWT } from '../../../utils/server/lib/JWTHelper';
import { Messages } from '../../../models/server';
import { AppEvents, Apps } from '../../../apps/server';
import { streamToBuffer } from './streamToBuffer';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

const cookie = new Cookies();
let maxFileSize = 0;

settings.watch('FileUpload_MaxFileSize', async function (value) {
	try {
		maxFileSize = parseInt(value);
	} catch (e) {
		maxFileSize = await Settings.findOneById('FileUpload_MaxFileSize').packageValue;
	}
});

const AvatarModel = new Mongo.Collection(Avatars.col.collectionName);
const UserDataFilesModel = new Mongo.Collection(UserDataFiles.col.collectionName);
const UploadsModel = new Mongo.Collection(Uploads.col.collectionName);

export const FileUpload = {
	handlers: {},

	getPath(path = '') {
		return `/file-upload/${path}`;
	},

	configureUploadsStore(store, name, options) {
		const type = name.split(':').pop();
		const stores = UploadFS.getStores();
		delete stores[name];

		return new UploadFS.store[store](
			Object.assign(
				{
					name,
				},
				options,
				FileUpload[`default${type}`](),
			),
		);
	},

	validateFileUpload(fileData) {
		const { file = fileData, content = Buffer.from([]) } = fileData;
		if (!Match.test(file.rid, String)) {
			return false;
		}

		// livechat users can upload files but they don't have an userId
		const user = file.userId ? Meteor.users.findOne(file.userId) : null;

		const room = Rooms.findOneById(file.rid);
		const directMessageAllowed = settings.get('FileUpload_Enabled_Direct');
		const fileUploadAllowed = settings.get('FileUpload_Enabled');
		if (user?.type !== 'app' && canAccessRoom(room, user, file) !== true) {
			return false;
		}
		const language = user ? user.language : 'en';
		if (!fileUploadAllowed) {
			const reason = TAPi18n.__('FileUpload_Disabled', language);
			throw new Meteor.Error('error-file-upload-disabled', reason);
		}

		if (!directMessageAllowed && room.t === 'd') {
			const reason = TAPi18n.__('File_not_allowed_direct_messages', language);
			throw new Meteor.Error('error-direct-message-file-upload-not-allowed', reason);
		}

		// -1 maxFileSize means there is no limit
		if (maxFileSize > -1 && file.size > maxFileSize) {
			const reason = TAPi18n.__(
				'File_exceeds_allowed_size_of_bytes',
				{
					size: filesize(maxFileSize),
				},
				language,
			);
			throw new Meteor.Error('error-file-too-large', reason);
		}

		if (!fileUploadIsValidContentType(file.type)) {
			const reason = TAPi18n.__('File_type_is_not_accepted', language);
			throw new Meteor.Error('error-invalid-file-type', reason);
		}

		// App IPreFileUpload event hook
		try {
			Promise.await(Apps.triggerEvent(AppEvents.IPreFileUpload, { file, content }));
		} catch (error) {
			if (error instanceof AppsEngineException) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}

		return true;
	},

	validateAvatarUpload({ file }) {
		if (!Match.test(file.rid, String) && !Match.test(file.userId, String)) {
			return false;
		}

		const user = file.uid ? Meteor.users.findOne(file.uid, { fields: { language: 1 } }) : null;
		const language = user?.language || 'en';

		// accept only images
		if (!/^image\//.test(file.type)) {
			const reason = TAPi18n.__('File_type_is_not_accepted', language);
			throw new Meteor.Error('error-invalid-file-type', reason);
		}

		// -1 maxFileSize means there is no limit
		if (maxFileSize > -1 && file.size > maxFileSize) {
			const reason = TAPi18n.__(
				'File_exceeds_allowed_size_of_bytes',
				{
					size: filesize(maxFileSize),
				},
				language,
			);
			throw new Meteor.Error('error-file-too-large', reason);
		}

		return true;
	},

	defaultUploads() {
		return {
			collection: UploadsModel,
			filter: new UploadFS.Filter({
				onCheck: FileUpload.validateFileUpload,
			}),
			getPath(file) {
				return `${settings.get('uniqueID')}/uploads/${file.rid}/${file.userId}/${file._id}`;
			},
			onValidate: FileUpload.uploadsOnValidate,
			onRead(fileId, file, req, res) {
				if (!FileUpload.requestCanAccessFiles(req)) {
					res.writeHead(403);
					return false;
				}

				res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
				return true;
			},
		};
	},

	defaultAvatars() {
		return {
			collection: AvatarModel,
			filter: new UploadFS.Filter({
				onCheck: FileUpload.validateAvatarUpload,
			}),
			getPath(file) {
				const avatarFile = file.rid ? `room-${file.rid}` : file.userId;
				return `${settings.get('uniqueID')}/avatars/${avatarFile}`;
			},
			onValidate: FileUpload.avatarsOnValidate,
			onFinishUpload: FileUpload.avatarsOnFinishUpload,
		};
	},

	defaultUserDataFiles() {
		return {
			collection: UserDataFilesModel,
			getPath(file) {
				return `${settings.get('uniqueID')}/uploads/userData/${file.userId}`;
			},
			onValidate: FileUpload.uploadsOnValidate,
			onRead(fileId, file, req, res) {
				if (!FileUpload.requestCanAccessFiles(req)) {
					res.writeHead(403);
					return false;
				}

				res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
				return true;
			},
		};
	},

	avatarsOnValidate(file) {
		if (settings.get('Accounts_AvatarResize') !== true) {
			return;
		}

		if (file.rid) {
			if (!hasPermission(Meteor.userId(), 'edit-room-avatar', file.rid)) {
				throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed');
			}
		} else if (Meteor.userId() !== file.userId && !hasPermission(Meteor.userId(), 'edit-other-user-avatar')) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed');
		}

		const tempFilePath = UploadFS.getTempFilePath(file._id);

		const height = settings.get('Accounts_AvatarSize');
		const width = height;
		const future = new Future();

		const s = sharp(tempFilePath);
		if (settings.get('FileUpload_RotateImages') === true) {
			s.rotate();
		}

		s.metadata(
			Meteor.bindEnvironment((err, metadata) => {
				if (!metadata) {
					metadata = {};
				}

				s.resize({
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
					.toBuffer({ resolveWithObject: true })
					.then(
						Meteor.bindEnvironment(({ data, info }) => {
							fs.writeFile(
								tempFilePath,
								data,
								Meteor.bindEnvironment((err) => {
									if (err != null) {
										SystemLogger.error(err);
									}

									this.getCollection().direct.update(
										{ _id: file._id },
										{
											$set: {
												size: info.size,
												...(['gif', 'svg'].includes(metadata.format) ? { type: 'image/png' } : {}),
											},
										},
									);
									future.return();
								}),
							);
						}),
					);
			}),
		);

		return future.wait();
	},

	resizeImagePreview(file) {
		file = Promise.await(Uploads.findOneById(file._id));
		file = FileUpload.addExtensionTo(file);
		const image = FileUpload.getStore('Uploads')._store.getReadStream(file._id, file);

		const transformer = sharp().resize({ width: 32, height: 32, fit: 'inside' }).jpeg().blur();
		const result = transformer.toBuffer().then((out) => out.toString('base64'));
		image.pipe(transformer);
		return result;
	},

	createImageThumbnail(file) {
		if (!settings.get('Message_Attachments_Thumbnails_Enabled')) {
			return;
		}

		const width = settings.get('Message_Attachments_Thumbnails_Width');
		const height = settings.get('Message_Attachments_Thumbnails_Height');

		if (file.identify.size && file.identify.size.height < height && file.identify.size.width < width) {
			return;
		}

		file = Promise.await(Uploads.findOneById(file._id));
		file = FileUpload.addExtensionTo(file);
		const store = FileUpload.getStore('Uploads');
		const image = store._store.getReadStream(file._id, file);

		const transformer = sharp().resize({ width, height, fit: 'inside' });

		const result = transformer.toBuffer({ resolveWithObject: true }).then(({ data, info: { width, height } }) => ({ data, width, height }));
		image.pipe(transformer);

		return result;
	},

	uploadImageThumbnail(file, buffer, rid, userId) {
		const store = FileUpload.getStore('Uploads');
		const details = {
			name: `thumb-${file.name}`,
			size: buffer.length,
			type: file.type,
			rid,
			userId,
		};

		return store.insertSync(details, buffer);
	},

	uploadsOnValidate(file) {
		if (!/^image\/((x-windows-)?bmp|p?jpeg|png|gif)$/.test(file.type)) {
			return;
		}

		const tmpFile = UploadFS.getTempFilePath(file._id);

		const fut = new Future();

		const s = sharp(tmpFile);
		s.metadata(
			Meteor.bindEnvironment((err, metadata) => {
				if (err != null) {
					SystemLogger.error(err);
					return fut.return();
				}

				const rotated = typeof metadata.orientation !== 'undefined' && metadata.orientation !== 1;

				const identify = {
					format: metadata.format,
					size: {
						width: rotated ? metadata.height : metadata.width,
						height: rotated ? metadata.width : metadata.height,
					},
				};

				const reorientation = (cb) => {
					if (!rotated || settings.get('FileUpload_RotateImages') !== true) {
						return cb();
					}
					s.rotate()
						.toFile(`${tmpFile}.tmp`)
						.then(
							Meteor.bindEnvironment(() => {
								fs.unlink(
									tmpFile,
									Meteor.bindEnvironment(() => {
										fs.rename(
											`${tmpFile}.tmp`,
											tmpFile,
											Meteor.bindEnvironment(() => {
												cb();
											}),
										);
									}),
								);
							}),
						)
						.catch((err) => {
							SystemLogger.error(err);
							fut.return();
						});
				};

				reorientation(() => {
					const { size } = fs.lstatSync(tmpFile);
					this.getCollection().direct.update(
						{ _id: file._id },
						{
							$set: { size, identify },
						},
					);

					fut.return();
				});
			}),
		);

		return fut.wait();
	},

	avatarRoomOnFinishUpload(file) {
		if (!hasPermission(Meteor.userId(), 'edit-room-avatar', file.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed');
		}
	},
	avatarsOnFinishUpload(file) {
		if (file.rid) {
			return FileUpload.avatarRoomOnFinishUpload(file);
		}

		if (Meteor.userId() !== file.userId && !hasPermission(Meteor.userId(), 'edit-other-user-avatar')) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed');
		}
		// update file record to match user's username
		const user = Users.findOneById(file.userId);
		const oldAvatar = Promise.await(Avatars.findOneByName(user.username));
		if (oldAvatar) {
			Promise.await(Avatars.deleteFile(oldAvatar._id));
		}
		Promise.await(Avatars.updateFileNameById(file._id, user.username));
		// console.log('upload finished ->', file);
	},

	requestCanAccessFiles({ headers = {}, query = {} }) {
		if (!settings.get('FileUpload_ProtectFiles')) {
			return true;
		}

		let { rc_uid, rc_token, rc_rid, rc_room_type } = query;
		const { token } = query;

		if (!rc_uid && headers.cookie) {
			rc_uid = cookie.get('rc_uid', headers.cookie);
			rc_token = cookie.get('rc_token', headers.cookie);
			rc_rid = cookie.get('rc_rid', headers.cookie);
			rc_room_type = cookie.get('rc_room_type', headers.cookie);
		}

		const isAuthorizedByCookies = rc_uid && rc_token && Users.findOneByIdAndLoginToken(rc_uid, rc_token);
		const isAuthorizedByHeaders =
			headers['x-user-id'] && headers['x-auth-token'] && Users.findOneByIdAndLoginToken(headers['x-user-id'], headers['x-auth-token']);
		const isAuthorizedByRoom =
			rc_room_type && roomCoordinator.getRoomDirectives(rc_room_type)?.canAccessUploadedFile({ rc_uid, rc_rid, rc_token });
		const isAuthorizedByJWT =
			settings.get('FileUpload_Enable_json_web_token_for_files') &&
			token &&
			isValidJWT(token, settings.get('FileUpload_json_web_token_secret_for_files'));
		return isAuthorizedByCookies || isAuthorizedByHeaders || isAuthorizedByRoom || isAuthorizedByJWT;
	},
	addExtensionTo(file) {
		if (mime.lookup(file.name) === file.type) {
			return file;
		}

		// This file type can be pretty much anything, so it's better if we don't mess with the file extension
		if (file.type !== 'application/octet-stream') {
			const ext = mime.extension(file.type);
			if (ext && new RegExp(`\\.${ext}$`, 'i').test(file.name) === false) {
				file.name = `${file.name}.${ext}`;
			}
		}

		return file;
	},

	getStore(modelName) {
		const storageType = settings.get('FileUpload_Storage_Type');
		const handlerName = `${storageType}:${modelName}`;

		return this.getStoreByName(handlerName);
	},

	getStoreByName(handlerName) {
		if (this.handlers[handlerName] == null) {
			SystemLogger.error(`Upload handler "${handlerName}" does not exists`);
		}
		return this.handlers[handlerName];
	},

	get(file, req, res, next) {
		const store = this.getStoreByName(file.store);
		if (store && store.get) {
			return store.get(file, req, res, next);
		}
		res.writeHead(404);
		res.end();
	},

	getBuffer(file, cb) {
		const store = this.getStoreByName(file.store);

		if (!store || !store.get) {
			cb(new Error('Store is invalid'), null);
		}

		const buffer = new streamBuffers.WritableStreamBuffer({
			initialSize: file.size,
		});

		buffer.on('finish', () => {
			cb(null, buffer.getContents());
		});

		store.copy(file, buffer);
	},

	getBufferSync: Meteor.wrapAsync((file, cb) => FileUpload.getBuffer(file, cb)),

	copy(file, targetFile) {
		const store = this.getStoreByName(file.store);
		const out = fs.createWriteStream(targetFile);

		file = FileUpload.addExtensionTo(file);

		if (store.copy) {
			store.copy(file, out);
			return true;
		}

		return false;
	},

	redirectToFile(fileUrl, req, res) {
		res.removeHeader('Content-Length');
		res.removeHeader('Cache-Control');
		res.setHeader('Location', fileUrl);
		res.writeHead(302);
		res.end();
	},

	proxyFile(fileName, fileUrl, forceDownload, request, req, res) {
		res.setHeader('Content-Disposition', `${forceDownload ? 'attachment' : 'inline'}; filename="${encodeURI(fileName)}"`);

		request.get(fileUrl, (fileRes) => fileRes.pipe(res));
	},

	generateJWTToFileUrls({ rid, userId, fileId }) {
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

	removeFilesByRoomId(rid) {
		if (typeof rid !== 'string' || rid.trim().length === 0) {
			return;
		}
		Messages.find(
			{
				rid,
				'file._id': {
					$exists: true,
				},
			},
			{
				fields: {
					'file._id': 1,
				},
			},
		)
			.fetch()
			.forEach((document) => FileUpload.getStore('Uploads').deleteById(document.file._id));
	},
};

export class FileUploadClass {
	constructor({ name, model, store, get, insert, getStore, copy }) {
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

		this.insertSync = Meteor.wrapAsync(this.insert, this);
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

	getModelFromName() {
		const modelsAvailable = {
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

	delete(fileId) {
		// TODO: Remove this method
		if (this.store && this.store.delete) {
			this.store.delete(fileId);
		}

		return Promise.await(this.model.deleteFile(fileId));
	}

	deleteById(fileId) {
		const file = Promise.await(this.model.findOneById(fileId));

		if (!file) {
			return;
		}

		const store = FileUpload.getStoreByName(file.store);

		return store.delete(file._id);
	}

	deleteByName(fileName) {
		const file = Promise.await(this.model.findOneByName(fileName));

		if (!file) {
			return;
		}

		const store = FileUpload.getStoreByName(file.store);

		return store.delete(file._id);
	}

	deleteByRoomId(rid) {
		const file = Promise.await(this.model.findOneByRoomId(rid));

		if (!file) {
			return;
		}

		const store = FileUpload.getStoreByName(file.store);

		return store.delete(file._id);
	}

	_doInsert(fileData, streamOrBuffer, cb) {
		const fileId = this.store.create(fileData);
		const token = this.store.createToken(fileId);
		const tmpFile = UploadFS.getTempFilePath(fileId);

		try {
			if (streamOrBuffer instanceof stream) {
				streamOrBuffer.pipe(fs.createWriteStream(tmpFile));
			} else if (streamOrBuffer instanceof Buffer) {
				fs.writeFileSync(tmpFile, streamOrBuffer);
			} else {
				throw new Error('Invalid file type');
			}

			const file = Meteor.call('ufsComplete', fileId, this.name, token);

			if (cb) {
				cb(null, file);
			}

			return file;
		} catch (e) {
			if (cb) {
				cb(e);
			} else {
				throw e;
			}
		}
	}

	insert(fileData, streamOrBuffer, cb) {
		if (streamOrBuffer instanceof stream) {
			streamOrBuffer = Promise.await(streamToBuffer(streamOrBuffer));
		}

		// Check if the fileData matches store filter
		const filter = this.store.getFilter();
		if (filter && filter.check) {
			filter.check({ file: fileData, content: streamOrBuffer });
		}

		return this._doInsert(fileData, streamOrBuffer, cb);
	}
}
