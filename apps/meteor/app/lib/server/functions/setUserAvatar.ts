import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Users } from '@rocket.chat/models';
import type { Response } from '@rocket.chat/server-fetch';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { checkUrlForSsrf } from './checkUrlForSsrf';
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
			updater.set('avatarOrigin', origin);
		} else {
			await Users.setAvatarData(user._id, service, null, { session });
		}
		return;
	}

	const { buffer, type } = await (async (): Promise<{ buffer: Buffer; type: string }> => {
		if (service === 'url' && typeof dataURI === 'string') {
			let response: Response;

			const isSsrfSafe = await checkUrlForSsrf(dataURI);
			if (!isSsrfSafe) {
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${encodeURI(dataURI)}`, {
					function: 'setUserAvatar',
					url: dataURI,
				});
			}

			try {
				response = await fetch(dataURI, { redirect: 'error' });
			} catch (e) {
				SystemLogger.info(`Not a valid response, from the avatar url: ${encodeURI(dataURI)}`);
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${encodeURI(dataURI)}`, {
					function: 'setUserAvatar',
					url: dataURI,
				});
			}

			if (response.status !== 200) {
				if (response.status !== 404) {
					SystemLogger.info(`Error while handling the setting of the avatar from a url (${encodeURI(dataURI)}) for ${user.username}`);
					throw new Meteor.Error(
						'error-avatar-url-handling',
						`Error while handling avatar setting from a URL (${encodeURI(dataURI)}) for ${user.username}`,
						{ function: 'RocketChat.setUserAvatar', url: dataURI, username: user.username },
					);
				}

				SystemLogger.info(`Not a valid response, ${response.status}, from the avatar url: ${dataURI}`);
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, {
					function: 'setUserAvatar',
					url: dataURI,
				});
			}

			if (!/image\/.+/.test(response.headers.get('content-type') || '')) {
				SystemLogger.info(
					`Not a valid content-type from the provided url, ${response.headers.get('content-type')}, from the avatar url: ${dataURI}`,
				);
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, {
					function: 'setUserAvatar',
					url: dataURI,
				});
			}

			return {
				buffer: Buffer.from(await response.arrayBuffer()),
				type: response.headers.get('content-type') || '',
			};
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
			updater.set('avatarOrigin', origin);
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
