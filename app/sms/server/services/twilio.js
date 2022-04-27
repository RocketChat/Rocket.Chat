import { Meteor } from 'meteor/meteor';
import twilio from 'twilio';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import filesize from 'filesize';

import { settings } from '../../../settings';
import { SMS } from '../SMS';
import { fileUploadIsValidContentType } from '../../../utils/lib/fileUploadRestrictions';
import { api } from '../../../../server/sdk/api';
import { SystemLogger } from '../../../../server/lib/logger/system';

const MAX_FILE_SIZE = 5242880;

const notifyAgent = (userId, rid, msg) =>
	api.broadcast('notify.ephemeralMessage', userId, rid, {
		msg,
	});

class Twilio {
	constructor() {
		this.accountSid = settings.get('SMS_Twilio_Account_SID');
		this.authToken = settings.get('SMS_Twilio_authToken');
		this.fileUploadEnabled = settings.get('SMS_Twilio_FileUpload_Enabled');
		this.mediaTypeWhiteList = settings.get('SMS_Twilio_FileUpload_MediaTypeWhiteList');
	}

	parse(data) {
		let numMedia = 0;

		const returnData = {
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

	send(fromNumber, toNumber, message, extraData) {
		const client = twilio(this.accountSid, this.authToken);
		let body = message;

		let mediaUrl;
		const defaultLanguage = settings.get('Language') || 'en';
		if (extraData && extraData.fileUpload) {
			const {
				rid,
				userId,
				fileUpload: { size, type, publicFilePath },
			} = extraData;
			const user = userId ? Meteor.users.findOne(userId) : null;
			const lng = (user && user.language) || defaultLanguage;

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
				return SystemLogger.error(`(Twilio) -> ${reason}`);
			}

			mediaUrl = [publicFilePath];
		}

		let persistentAction;
		if (extraData && extraData.location) {
			const [longitude, latitude] = extraData.location.coordinates;
			persistentAction = `geo:${latitude},${longitude}`;
			body = TAPi18n.__('Location', { lng: defaultLanguage });
		}

		client.messages.create({
			to: toNumber,
			from: fromNumber,
			body,
			...(mediaUrl && { mediaUrl }),
			...(persistentAction && { persistentAction }),
		});
	}

	response(/* message */) {
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: '<Response></Response>',
		};
	}

	error(error) {
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

SMS.registerService('twilio', Twilio);
