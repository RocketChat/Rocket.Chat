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

const DEFAULT_AVATAR_DOWNLOAD_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_FILE_SIZE = 104_857_600;

const getMediaType = (contentTypeHeader: string | null): string => {
	const mediaType = contentTypeHeader?.split(';', 1)[0].trim().toLowerCase();

	return mediaType || '';
};

const isImageContentType = (contentTypeHeader: string | null): boolean => /^image\/[^;\s]+$/.test(getMediaType(contentTypeHeader));

const isRequestTimeoutError = (error: unknown): boolean => {
	if (!error || typeof error !== 'object') {
		return false;
	}

	const { name, code, type } = error as { name?: string; code?: string; type?: string };

	return name === 'AbortError' || code === 'ETIMEDOUT' || type === 'request-timeout' || type === 'body-timeout';
};

const isResponseTooLargeError = (error: unknown): boolean => {
	if (!error || typeof error !== 'object') {
		return false;
	}

	return (error as { type?: string }).type === 'max-size';
};

const redactUrl = (url: string): string => {
	try {
		const parsed = new URL(url);
		parsed.username = '';
		parsed.password = '';
		parsed.searchParams.forEach((_value, key) => {
			if (/token|key|secret|password|auth|session|sid/i.test(key)) {
				parsed.searchParams.set(key, '[redacted]');
			}
		});

		return parsed.toString();
	} catch {
		return '[invalid-url]';
	}
};

const getMaxFileSize = (): number => {
	const maxFileSizeSetting = Number(settings.get('FileUpload_MaxFileSize'));

	return Number.isFinite(maxFileSizeSetting) && maxFileSizeSetting > 0 ? maxFileSizeSetting : DEFAULT_MAX_FILE_SIZE;
};

const throwInvalidAvatarUrl = (dataURI: string): never => {
	throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${encodeURI(dataURI)}`, {
		function: 'setUserAvatar',
		url: dataURI,
	});
};

const throwAvatarDownloadTimeout = (dataURI: string): never => {
	throw new Meteor.Error('error-avatar-download-timeout', 'Avatar download timed out', {
		function: 'setUserAvatar',
		url: dataURI,
		timeoutMs: DEFAULT_AVATAR_DOWNLOAD_TIMEOUT_MS,
	});
};

const throwAvatarUrlHandling = (dataURI: string, username: string): never => {
	throw new Meteor.Error(
		'error-avatar-url-handling',
		`Error while handling avatar setting from a URL (${encodeURI(dataURI)}) for ${username}`,
		{ function: 'RocketChat.setUserAvatar', url: dataURI, username },
	);
};

const getAvatarFromUrl = async (
	user: Pick<IUser, 'username'> & { username: string },
	dataURI: string,
): Promise<{ buffer: Buffer; type: string }> => {
	const maxFileSize = getMaxFileSize();
	let response!: Response;

	try {
		response = await fetch(dataURI, {
			ignoreSsrfValidation: false,
			allowList: settings.get<string>('SSRF_Allowlist'),
			size: maxFileSize,
			timeout: DEFAULT_AVATAR_DOWNLOAD_TIMEOUT_MS,
		});
	} catch (error) {
		if (isRequestTimeoutError(error)) {
			throwAvatarDownloadTimeout(dataURI);
		}

		SystemLogger.info({
			msg: 'Not a valid response from the avatar url',
			url: redactUrl(dataURI),
			err: error,
		});
		throwInvalidAvatarUrl(dataURI);
	}

	if (response.status !== 200) {
		if (response.status !== 404) {
			SystemLogger.info({
				msg: 'Error while handling the setting of the avatar from a url',
				url: redactUrl(dataURI),
				username: user.username,
				status: response.status,
			});
			throwAvatarUrlHandling(dataURI, user.username);
		}

		SystemLogger.info({
			msg: 'Not a valid response from the avatar url',
			status: response.status,
			url: redactUrl(dataURI),
		});
		throwInvalidAvatarUrl(dataURI);
	}

	const type = response.headers.get('content-type') || '';
	if (!isImageContentType(type)) {
		SystemLogger.info({
			msg: 'Not a valid content-type from the provided avatar url',
			contentType: type,
			url: redactUrl(dataURI),
		});
		throwInvalidAvatarUrl(dataURI);
	}

	try {
		return {
			buffer: Buffer.from(await response.arrayBuffer()),
			type,
		};
	} catch (error) {
		if (isResponseTooLargeError(error)) {
			throw new Meteor.Error('error-file-too-large', 'Avatar file exceeds allowed size limit', {
				function: 'setUserAvatar',
				url: dataURI,
				sizeLimit: maxFileSize,
			});
		}

		if (isRequestTimeoutError(error)) {
			throwAvatarDownloadTimeout(dataURI);
		}

		SystemLogger.info({
			msg: 'Error while downloading avatar from provided url',
			url: redactUrl(dataURI),
			username: user.username,
			err: error,
		});
		return throwAvatarUrlHandling(dataURI, user.username);
	}
};

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
			if (!user.username) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					function: 'setUserAvatar',
				});
			}

			return getAvatarFromUrl({ username: user.username }, dataURI);
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
	if (user.username) {
		await fileStore.deleteByName(user.username, { session });
	}

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
