import { Meteor } from 'meteor/meteor';
import twilio from 'twilio';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import filesize from 'filesize';

import { settings } from '../../../settings';
import { SMS } from '../SMS';
import { Notifications } from '../../../notifications';
import { fileUploadIsValidContentType } from '../../../utils/lib/fileUploadRestrictions';

const MAX_FILE_SIZE = 5242880;

const notifyAgent = (userId, rid, msg) => Notifications.notifyUser(userId, 'message', {
	_id: Random.id(),
	rid,
	ts: new Date(),
	msg,
});

class Twilio {
	constructor() {
		this.accountSid = settings.get('SMS_Twilio_Account_SID');
		this.authToken = settings.get('SMS_Twilio_authToken');
		this.fileUploadEnabled = settings.get('SMS_Twilio_FileUpload_Enabled');
		this.mediaTypeWhiteList = settings.get('SMS_Twilio_FileUpload_MediaTypeWhiteList');
		this.siteUrl = settings.get('Site_Url');
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
			},
		};

		if (data.NumMedia) {
			numMedia = parseInt(data.NumMedia, 10);
		}

		if (isNaN(numMedia)) {
			console.error(`Error parsing NumMedia ${ data.NumMedia }`);
			return returnData;
		}

		returnData.media = [];

		for (let mediaIndex = 0; mediaIndex < numMedia; mediaIndex++) {
			const media = {
				url: '',
				contentType: '',
			};

			const mediaUrl = data[`MediaUrl${ mediaIndex }`];
			const contentType = data[`MediaContentType${ mediaIndex }`];

			media.url = mediaUrl;
			media.contentType = contentType;

			returnData.media.push(media);
		}

		return returnData;
	}

	send(fromNumber, toNumber, message, extraData = {}) {
		const client = twilio(this.accountSid, this.authToken);

		let mediaUrl;
		const { rid, userId, attachments } = extraData;

		if (attachments) {
			const user = userId ? Meteor.users.findOne(userId) : null;
			const lng = (user && user.language) || settings.get('Language') || 'en';
			// const { type: mime_type, size, dataURI: base64 } = attachment;
			console.log('attachments');
			console.log(attachments);
			const {
				fileUploadEnabled,
				fileUploadMaxFileSize,
				fileUploadMediaTypeWhiteList,
			} = this.config;

			let reason;
			if (!fileUploadEnabled) {
				reason = TAPi18n.__('FileUpload_Disabled', { lng });
			} else if (fileUploadMaxFileSize > -1 && MAX_FILE_SIZE > fileUploadMaxFileSize) {
				reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
					size: filesize(fileUploadMaxFileSize),
					lng,
				});
			} else if (!fileUploadIsValidContentType('mime_type', fileUploadMediaTypeWhiteList)) {
				reason = TAPi18n.__('File_type_is_not_accepted', { lng });
			}

			if (reason) {
				rid && userId && notifyAgent(userId, rid, reason);
				return console.error(`(WhatsAppGateway) -> ${ reason }`);
			}

			// midia = { mime_type, base64 };
		}
		console.log('extraData');
		console.log(extraData);
		// return `${ settings.get('Site_Url') }/admin/cloud/oauth-callback`.replace(/\/\/admin+/g, '/admin');
		client.messages.create({
			to: toNumber,
			from: fromNumber,
			body: message,
			...mediaUrl && { mediaUrl },
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
			message = `<Message>${ error.reason }</Message>`;
		}
		return {
			headers: {
				'Content-Type': 'text/xml',
			},
			body: `<Response>${ message }</Response>`,
		};
	}
}

SMS.registerService('twilio', Twilio);
