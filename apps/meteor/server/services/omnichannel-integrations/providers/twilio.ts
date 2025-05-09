import { api } from '@rocket.chat/core-services';
import type { ISMSProvider, ServiceData, SMSProviderResponse, SMSProviderResult } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import filesize from 'filesize';
import twilio from 'twilio';

import { settings } from '../../../../app/settings/server';
import { fileUploadIsValidContentType } from '../../../../app/utils/server/restrictions';
import { i18n } from '../../../lib/i18n';
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

const notifyAgent = (userId: string | undefined, rid: string | undefined, msg: string) =>
	userId &&
	rid &&
	void api.broadcast('notify.ephemeralMessage', userId, rid, {
		msg,
	});

export class Twilio implements ISMSProvider {
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

	private async getClient(rid?: string, userId?: string) {
		const sid = settings.get<string>('SMS_Twilio_Account_SID');
		const token = settings.get<string>('SMS_Twilio_authToken');
		if (!sid || !token) {
			await notifyAgent(userId, rid, i18n.t('SMS_Twilio_NotConfigured'));
			return;
		}

		try {
			return twilio(sid, token);
		} catch (error) {
			await notifyAgent(userId, rid, i18n.t('SMS_Twilio_InvalidCredentials'));
			SystemLogger.error(`(Twilio) -> ${error}`);
		}
	}

	private async validateFileUpload(
		extraData: {
			fileUpload?: { size: number; type: string; publicFilePath: string };
			location?: { coordinates: [number, number] };
			rid?: string;
			userId?: string;
		},
		lang: string,
	): Promise<string> {
		const { rid, userId, fileUpload: { size, type, publicFilePath } = { size: 0, type: 'invalid' } } = extraData;
		const user = userId ? await Users.findOne({ _id: userId }, { projection: { language: 1 } }) : null;
		const lng = user?.language || lang;

		let reason;
		if (!settings.get('SMS_Twilio_FileUpload_Enabled')) {
			reason = i18n.t('FileUpload_Disabled', { lng });
		} else if (size > MAX_FILE_SIZE) {
			reason = i18n.t('File_exceeds_allowed_size_of_bytes', {
				size: filesize(MAX_FILE_SIZE),
				lng,
			});
		} else if (!fileUploadIsValidContentType(type, settings.get('SMS_Twilio_FileUpload_MediaTypeWhiteList'))) {
			reason = i18n.t('File_type_is_not_accepted', { lng });
		} else if (!publicFilePath) {
			reason = i18n.t('FileUpload_NotAllowed', { lng });
		}

		// Check if JWT is set for public file uploads when protect_files is on
		// If it's not, notify user upload won't go to twilio
		const protectFileUploads = settings.get('FileUpload_ProtectFiles');
		const jwtEnabled = settings.get('FileUpload_Enable_json_web_token_for_files');
		const isJWTKeySet = jwtEnabled && !!settings.get('FileUpload_json_web_token_secret_for_files');

		if (protectFileUploads && (!jwtEnabled || !isJWTKeySet)) {
			reason = i18n.t('FileUpload_ProtectFilesEnabled_JWTNotSet', { lng });
		}

		if (reason) {
			await notifyAgent(userId, rid, reason);
			SystemLogger.error(`(Twilio) -> ${reason}`);
			return '';
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return publicFilePath!;
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
		const { rid, userId } = extraData || {};

		const client = await this.getClient(rid, userId);
		if (!client) {
			return {
				isSuccess: false,
				resultMsg: 'Twilio not configured',
			};
		}

		let body = message;

		let mediaUrl;
		const defaultLanguage = settings.get<string>('Language') || 'en';
		if (extraData?.fileUpload) {
			const publicFilePath = await this.validateFileUpload(extraData, defaultLanguage);
			if (!publicFilePath) {
				return {
					isSuccess: false,
					resultMsg: 'File upload not allowed',
				};
			}
			mediaUrl = [publicFilePath];
		}

		let persistentAction;
		if (extraData?.location) {
			const [longitude, latitude] = extraData.location.coordinates;
			persistentAction = [`geo:${latitude},${longitude}`];
			body = i18n.t('Location', { lng: defaultLanguage });
		}

		try {
			const result = await client.messages.create({
				to: toNumber,
				from: fromNumber,
				body,
				...(mediaUrl && { mediaUrl }),
				...(persistentAction && { persistentAction }),
			});

			if (result.errorCode) {
				await notifyAgent(userId, rid, result.errorMessage);
				SystemLogger.error(`(Twilio) -> ${result.errorCode}`);
			}

			return {
				isSuccess: result.status !== 'failed',
				resultMsg: result.status,
			};
		} catch (e: any) {
			await notifyAgent(userId, rid, e.message);
			return {
				isSuccess: false,
				resultMsg: e.message,
			};
		}
	}

	response(): SMSProviderResponse {
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: '<Response></Response>',
		};
	}

	async isRequestFromTwilio(signature: string, request: Request): Promise<boolean> {
		const authToken = settings.get<string>('SMS_Twilio_authToken');
		let siteUrl = settings.get<string>('Site_Url');
		if (siteUrl.endsWith('/')) {
			siteUrl = siteUrl.replace(/.$/, '');
		}

		if (!authToken || !siteUrl) {
			SystemLogger.error(`(Twilio) -> URL or Twilio token not configured.`);
			return false;
		}

		const twilioUrl = request.url ? `${siteUrl}${request.url}` : `${siteUrl}/api/v1/livechat/sms-incoming/twilio`;

		let body = {};
		try {
			body = await request.json();
			// eslint-disable-next-line no-empty
		} catch {}

		return twilio.validateRequest(authToken, signature, twilioUrl, body);
	}

	async validateRequest(request: Request): Promise<boolean> {
		// We're not getting original twilio requests on CI :p
		if (process.env.TEST_MODE === 'true') {
			return true;
		}
		const twilioHeader = request.headers.get('x-twilio-signature') || '';
		const twilioSignature = Array.isArray(twilioHeader) ? twilioHeader[0] : twilioHeader;
		return this.isRequestFromTwilio(twilioSignature, request);
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
