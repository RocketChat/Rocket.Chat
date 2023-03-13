import { HTTP } from 'meteor/http';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import filesize from 'filesize';
import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { ISMSProvider, ServiceData, SMSProviderResponse } from '@rocket.chat/core-typings';

import { settings } from '../../../../app/settings/server';
import { fileUploadIsValidContentType } from '../../../../app/utils/lib/fileUploadRestrictions';
import { mime } from '../../../../app/utils/lib/mimeTypes';
import { SystemLogger } from '../../../lib/logger/system';

type VoxtelesysData = {
	from: string;
	to: string;
	body: string;
	received_at: string;
	media: string[];
};

const isVoxtelesysData = (data: unknown): data is VoxtelesysData => {
	if (typeof data !== 'object' || data === null) {
		return false;
	}

	const { from, to, body } = data as Record<string, unknown>;

	return typeof from === 'string' && typeof to === 'string' && typeof body === 'string';
};

const MAX_FILE_SIZE = 5242880;

const notifyAgent = (userId: string, rid: string, msg: string) =>
	api.broadcast('notify.ephemeralMessage', userId, rid, {
		msg,
	});

export class Voxtelesys implements ISMSProvider {
	authToken: string;

	URL: string;

	fileUploadEnabled: string;

	mediaTypeWhiteList: string;

	constructor() {
		this.authToken = settings.get('SMS_Voxtelesys_authToken');
		this.URL = settings.get('SMS_Voxtelesys_URL');
		this.fileUploadEnabled = settings.get('SMS_Voxtelesys_FileUpload_Enabled');
		this.mediaTypeWhiteList = settings.get('SMS_Voxtelesys_FileUpload_MediaTypeWhiteList');
	}

	parse(data: unknown): ServiceData {
		if (!isVoxtelesysData(data)) {
			throw new Error('Invalid data');
		}

		const returnData: ServiceData = {
			from: data.from,
			to: data.to,
			body: data.body,
			media: [],

			extra: {
				received_at: data.received_at,
			},
		};

		if (!data.media) {
			return returnData;
		}

		for (let mediaIndex = 0; mediaIndex < data.media.length; mediaIndex++) {
			const media = {
				url: '',
				contentType: '',
			};

			const mediaUrl = data.media[mediaIndex];
			const contentType = mime.lookup(new URL(data.media[mediaIndex]).pathname);

			media.url = mediaUrl;
			media.contentType = contentType as string;

			returnData?.media?.push(media);
		}

		return returnData;
	}

	async send(
		fromNumber: string,
		toNumber: string,
		message: string,
		extraData?: {
			fileUpload?: { size: number; type: string; publicFilePath: string };
			location?: { coordinates: [number, number] };
			rid?: string;
			userId?: string;
		},
	): Promise<void> {
		let media;
		const defaultLanguage = settings.get<string>('Language') || 'en';
		if (extraData?.fileUpload) {
			const {
				rid,
				userId,
				fileUpload: { size, type, publicFilePath },
			} = extraData;
			const user = userId ? await Users.findOne(userId, { projection: { language: 1 } }) : null;
			const lng = user?.language || defaultLanguage;

			let reason;
			if (!this.fileUploadEnabled) {
				reason = TAPi18n.__('FileUpload_Disabled', { lng });
			} else if (size > MAX_FILE_SIZE) {
				reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
					size: filesize(MAX_FILE_SIZE),
					lng,
				});
			} else if (!fileUploadIsValidContentType(type, this.fileUploadMediaTypeWhiteList)) {
				reason = TAPi18n.__('File_type_is_not_accepted', { lng });
			}

			if (reason) {
				rid && userId && notifyAgent(userId, rid, reason);
				return SystemLogger.error(`(Voxtelesys) -> ${reason}`);
			}

			media = [publicFilePath];
		}

		const options = {
			headers: {
				Authorization: `Bearer ${this.authToken}`,
			},
			data: {
				to: [toNumber],
				from: fromNumber,
				body: message,
				...(media && { media }),
			},
		};

		try {
			HTTP.call('POST', this.URL || 'https://smsapi.voxtelesys.net/api/v1/sms', options);
		} catch (err) {
			SystemLogger.error({ msg: 'Error connecting to Voxtelesys SMS API', err });
		}
	}

	fileUploadMediaTypeWhiteList() {
		throw new Error('Method not implemented.');
	}

	response(): SMSProviderResponse {
		return {
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				success: true,
			},
		};
	}

	error(error: Error & { reason?: string }): SMSProviderResponse {
		let message = '';
		if (error.reason) {
			message = error.reason;
		}
		return {
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				success: false,
				error: message,
			},
		};
	}
}
