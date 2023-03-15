import twilio from 'twilio';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { ISMSProvider, ServiceData, SMSProviderResponse, SMSProviderResult } from '@rocket.chat/core-typings';
import filesize from 'filesize';
import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../../app/settings/server';
import { fileUploadIsValidContentType } from '../../../../app/utils/lib/fileUploadRestrictions';
import { SystemLogger } from '../../../lib/logger/system';

type TwilioData = {
	From: string;
	To: string;
	Body: string;
	NumMedia?: string;
	ToCountry?: string;
	ToState?: string;
	ToCity?: string;
	ToZip?: string;
	FromCountry?: string;
	FromState?: string;
	FromCity?: string;
	FromZip?: string;
	Latitude?: string;
	Longitude?: string;
} & Record<`MediaUrl${number}`, string> &
	Record<`MediaContentType${number}`, string>;

const isTwilioData = (data: unknown): data is TwilioData => {
	if (typeof data !== 'object' || data === null) {
		return false;
	}

	const { From, To, Body } = data as Record<string, unknown>;

	return typeof From === 'string' && typeof To === 'string' && typeof Body === 'string';
};

const MAX_FILE_SIZE = 5242880;

const notifyAgent = (userId: string, rid: string, msg: string) =>
	api.broadcast('notify.ephemeralMessage', userId, rid, {
		msg,
	});

export class Twilio implements ISMSProvider {
	accountSid: string;

	authToken: string;

	fileUploadEnabled: string;

	mediaTypeWhiteList: string;

	constructor() {
		this.accountSid = settings.get('SMS_Twilio_Account_SID');
		this.authToken = settings.get('SMS_Twilio_authToken');
		this.fileUploadEnabled = settings.get('SMS_Twilio_FileUpload_Enabled');
		this.mediaTypeWhiteList = settings.get('SMS_Twilio_FileUpload_MediaTypeWhiteList');
	}

	parse(data: unknown): ServiceData {
		let numMedia = 0;

		if (!isTwilioData(data)) {
			throw new Error('Invalid data');
		}

		const returnData: ServiceData = {
			from: data.From,
			to: data.To,
			body: data.Body,

			extra: {
				toCountry: data.ToCountry,
				toState: data.ToState,
				toCity: data.ToCity,
				toZip: data.ToZip,
				fromCountry: data.FromCountry,
				fromState: data.FromState,
				fromCity: data.FromCity,
				fromZip: data.FromZip,
				fromLatitude: data.Latitude,
				fromLongitude: data.Longitude,
			},
		};

		if (data.NumMedia) {
			numMedia = parseInt(data.NumMedia, 10);
		}

		if (isNaN(numMedia)) {
			SystemLogger.error(`Error parsing NumMedia ${data.NumMedia}`);
			return returnData;
		}

		returnData.media = [];

		for (let mediaIndex = 0; mediaIndex < numMedia; mediaIndex++) {
			const media = {
				url: '',
				contentType: '',
			};

			const mediaUrl = data[`MediaUrl${mediaIndex}`];
			const contentType = data[`MediaContentType${mediaIndex}`];

			media.url = mediaUrl;
			media.contentType = contentType;

			returnData.media.push(media);
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
	): Promise<SMSProviderResult> {
		const client = twilio(this.accountSid, this.authToken);
		let body = message;

		let mediaUrl;
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
				SystemLogger.error(`(Twilio) -> ${reason}`);
			}

			mediaUrl = [publicFilePath];
		}

		let persistentAction;
		if (extraData?.location) {
			const [longitude, latitude] = extraData.location.coordinates;
			persistentAction = `geo:${latitude},${longitude}`;
			body = TAPi18n.__('Location', { lng: defaultLanguage });
		}

		const result = await client.messages.create({
			to: toNumber,
			from: fromNumber,
			body,
			...(mediaUrl && { mediaUrl }),
			...(persistentAction && { persistentAction }),
		});

		return {
			isSuccess: result.status !== 'failed',
			resultMsg: result.status,
		};
	}

	fileUploadMediaTypeWhiteList() {
		throw new Error('Method not implemented.');
	}

	response(): SMSProviderResponse {
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: '<Response></Response>',
		};
	}

	error(error: Error & { reason?: string }): SMSProviderResponse {
		let message = '';
		if (error.reason) {
			message = `<Message>${error.reason}</Message>`;
		}
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: `<Response>${message}</Response>`,
		};
	}
}
