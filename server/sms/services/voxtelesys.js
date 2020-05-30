import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import filesize from 'filesize';

import { settings } from '../../../app/settings';
import { SMS } from '../SMS';
import { Notifications } from '../../../app/notifications';
import { fileUploadIsValidContentType } from '../../../app/utils/lib/fileUploadRestrictions';
import { mime } from '../../../app/utils/lib/mimeTypes';

const MAX_FILE_SIZE = 5242880;

const notifyAgent = (userId, rid, msg) => Notifications.notifyUser(userId, 'message', {
	_id: Random.id(),
	rid,
	ts: new Date(),
	msg,
});

class Voxtelesys {
	constructor() {
		this.authToken = settings.get('SMS_Voxtelesys_authToken');
		this.URL = settings.get('SMS_Voxtelesys_URL');
		this.fileUploadEnabled = settings.get('SMS_Voxtelesys_FileUpload_Enabled');
		this.mediaTypeWhiteList = settings.get('SMS_Voxtelesys_FileUpload_MediaTypeWhiteList');
	}

	parse(data) {
		const returnData = {
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
			media.contentType = contentType;

			returnData.media.push(media);
		}

		return returnData;
	}

	send(fromNumber, toNumber, message, extraData) {
		let media;
		const defaultLanguage = settings.get('Language') || 'en';
		if (extraData && extraData.fileUpload) {
			const { rid, userId, fileUpload: { size, type, publicFilePath } } = extraData;
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
				return console.error(`(Voxtelesys) -> ${ reason }`);
			}

			media = [publicFilePath];
		}

		const options = {
			headers: {
				Authorization: `Bearer ${ this.authToken }`,
			},
			data: {
				to: [toNumber],
				from: fromNumber,
				body: message,
				...media && { media },
			},
		};

		try {
			HTTP.call('POST', this.URL || 'https://smsapi.voxtelesys.net/api/v1/sms', options);
		} catch (error) {
			console.error(`Error connecting to Voxtelesys SMS API: ${ error }`);
		}
	}

	response(/* message */) {
		return {
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				success: true,
			},
		};
	}

	error(error) {
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

SMS.registerService('voxtelesys', Voxtelesys);
