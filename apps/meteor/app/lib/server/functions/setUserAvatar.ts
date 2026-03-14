import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Users } from '@rocket.chat/models';
import type { Response } from '@rocket.chat/server-fetch';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFile } from '../../../file/server';
import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';

export const setAvatarFromServiceWithValidation = async (
	userId: string,
	dataURI: string,
	contentType?: string,
	service?: string,
	targetUserId?: string,
): Promise<void> => {
	if (!dataURI) {
		throw new Meteor.Error('error-invalid-data', 'Invalid dataURI', {
			method: 'setAvatarFromService',
		});
	}

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'setAvatarFromService',
		});
	}

	if (!settings.get('Accounts_AllowUserAvatarChange')) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'setAvatarFromService',
		});
	}

	let user: IUser | null;

	if (targetUserId && targetUserId !== userId) {
		if (!(await hasPermissionAsync(userId, 'edit-other-user-avatar'))) {
			throw new Meteor.Error('error-unauthorized', 'Unauthorized', {
				method: 'setAvatarFromService',
			});
		}

		user = await Users.findOneById(targetUserId, { projection: { _id: 1, username: 1 } });
	} else {
		user = await Users.findOneById(userId, { projection: { _id: 1, username: 1 } });
	}

	if (!user) {
		throw new Meteor.Error('error-invalid-desired-user', 'Invalid desired user', {
			method: 'setAvatarFromService',
		});
	}

	return setUserAvatar(user, dataURI, contentType, service);
};

export function setUserAvatar(
	user: Pick<IUser, '_id' | 'username'>,
	dataURI: Buffer,
	contentType: string,
	service: 'rest',
	etag?: string,
	updater?: Updater<IUser>,
	session?: ClientSession,
): Promise<void>;
export function setUserAvatar(
	user: Pick<IUser, '_id' | 'username'>,
	dataURI: string,
	contentType?: string,
	service?: 'initials' | 'url' | 'rest' | string,
	etag?: string,
	updater?: Updater<IUser>,
	session?: ClientSession,
): Promise<void>;
export async function setUserAvatar(
	user: Pick<IUser, '_id' | 'username'>,
	dataURI: string | Buffer,
	contentType: string | undefined,
	service?: 'initials' | 'url' | 'rest' | string,
	etag?: string,
	updater?: Updater<IUser>,
	session?: ClientSession,
): Promise<void> {
	if (service === 'initials') {
		if (updater) {
			updater.set('avatarOrigin', service);
		} else {
			await Users.setAvatarData(user._id, service, null, { session });
		}
		return;
	}

	const { buffer, type } = await (async (): Promise<{ buffer: Buffer; type: string }> => {
		if (service === 'url' && typeof dataURI === 'string') {
			const controller = new AbortController();
			const AVATAR_FETCH_TIMEOUT_MS = 30_000;
			const timer = setTimeout(() => controller.abort(), AVATAR_FETCH_TIMEOUT_MS);

			try {
				let response: Response;

				try {
					response = await fetch(dataURI, {
						ignoreSsrfValidation: false,
						allowList: settings.get<string>('SSRF_Allowlist'),
						signal: controller.signal,
					});
				} catch (e) {
					if (controller.signal.aborted) {
						throw new Meteor.Error('error-avatar-url-timeout', `Avatar URL timed out after ${AVATAR_FETCH_TIMEOUT_MS}ms: ${encodeURI(dataURI)}`, {
							function: 'setUserAvatar',
							url: dataURI,
						});
					}
					SystemLogger.info({
						msg: 'Not a valid response from the avatar url',
						url: encodeURI(dataURI),
						err: e,
					});
					throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${encodeURI(dataURI)}`, {
						function: 'setUserAvatar',
						url: dataURI,
					});
				}

				if (response.status !== 200) {
					if (response.status !== 404) {
						SystemLogger.info({
							msg: 'Error while handling the setting of the avatar from a url',
							url: encodeURI(dataURI),
							username: user.username,
							status: response.status,
						});
						throw new Meteor.Error(
							'error-avatar-url-handling',
							`Error while handling avatar setting from a URL (${encodeURI(dataURI)}) for ${user.username}`,
							{ function: 'RocketChat.setUserAvatar', url: dataURI, username: user.username },
						);
					}

					SystemLogger.info({
						msg: 'Not a valid response from the avatar url',
						status: response.status,
						url: dataURI,
					});
					throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, {
						function: 'setUserAvatar',
						url: dataURI,
					});
				}

				const ALLOWED_AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
				const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
				if (!ALLOWED_AVATAR_MIME_TYPES.includes(contentType)) {
					SystemLogger.info({
						msg: 'Not a valid content-type from the provided avatar url',
						contentType: response.headers.get('content-type'),
						url: dataURI,
					});
					throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, {
						function: 'setUserAvatar',
						url: dataURI,
					});
				}

				const maxSize = settings.get<number>('FileUpload_MaxFileSize') || 104857600;

				// Reject early if Content-Length header already exceeds the limit
				const contentLengthHeader = response.headers.get('content-length');
				if (contentLengthHeader) {
					const declaredSize = parseInt(contentLengthHeader, 10);
					if (!Number.isNaN(declaredSize) && declaredSize > maxSize) {
						throw new Meteor.Error('error-avatar-image-too-large', 'Avatar image exceeds the maximum allowed file size', {
							function: 'setUserAvatar',
							url: dataURI,
						});
					}
				}

				// Stream the body, counting bytes so we abort even when Content-Length is absent
				if (!response.body) {
					throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, {
						function: 'setUserAvatar',
						url: dataURI,
					});
				}

				const chunks: Buffer[] = [];
				let downloaded = 0;
				for await (const chunk of response.body) {
					const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as unknown as Uint8Array);
					downloaded += part.length;
					if (downloaded > maxSize) {
						throw new Meteor.Error('error-avatar-image-too-large', 'Avatar image exceeds the maximum allowed file size', {
							function: 'setUserAvatar',
							url: dataURI,
						});
					}
					chunks.push(part);
				}

				return {
					buffer: Buffer.concat(chunks),
					type: response.headers.get('content-type') || '',
				};
			} catch (e) {
				// Convert a mid-stream abort (timer fired during body read) to a clean error
				if (controller.signal.aborted && !(e instanceof Meteor.Error)) {
					throw new Meteor.Error('error-avatar-url-timeout', `Avatar URL timed out after ${AVATAR_FETCH_TIMEOUT_MS}ms: ${encodeURI(dataURI)}`, {
						function: 'setUserAvatar',
						url: dataURI,
					});
				}
				throw e;
			} finally {
				clearTimeout(timer);
			}
		}

		if (service === 'rest') {
			if (!contentType) {
				throw new Meteor.Error('error-avatar-invalid-content-type', 'Invalid avatar content type', {
					function: 'setUserAvatar',
				});
			}

			return {
				buffer: typeof dataURI === 'string' ? Buffer.from(dataURI, 'binary') : dataURI,
				type: contentType,
			};
		}

		const fileData = RocketChatFile.dataURIParse(dataURI);

		return {
			buffer: Buffer.from(fileData.image, 'base64'),
			type: fileData.contentType,
		};
	})();

	const fileStore = FileUpload.getStore('Avatars');
	user.username && (await fileStore.deleteByName(user.username, { session }));

	const file = {
		userId: user._id,
		type,
		size: buffer.length,
	};

	const result = await fileStore.insert(file, buffer, { session });

	const avatarETag = etag || result?.etag || '';

	if (service) {
		if (updater) {
			updater.set('avatarOrigin', service);
			updater.set('avatarETag', avatarETag);
		} else {
			// TODO: Why was this timeout added?
			setTimeout(async () => Users.setAvatarData(user._id, service, avatarETag, { session }), 500);
		}

		await onceTransactionCommitedSuccessfully(async () => {
			void api.broadcast('user.avatarUpdate', {
				username: user.username,
				avatarETag,
			});
		}, session);
	}
}
