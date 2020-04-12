import { Meteor } from 'meteor/meteor';
import * as zenvia from '@zenvia/sdk';
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

class Zenvia {
	constructor() {
		this.apiToken = settings.get('SMS_Zenvia_API_Token');
		this.channel = settings.get('SMS_Zenvia_Channel');
		this.from = settings.get('SMS_Zenvia_From');
		this.fileUploadEnabled = settings.get('SMS_Zenvia_FileUpload_Enabled');
		this.mediaTypeWhiteList = settings.get('SMS_Zenvia_FileUpload_MediaTypeWhiteList');
	}

	parse(data) {
		const defaultLanguage = settings.get('Language') || 'en';
		let numMedia = 0;

		const returnData = {
			from: data.message.from,
			to: data.message.to,
			body: '',

			extra: {
				toCountry: undefined,
				toState: undefined,
				toCity: undefined,
				toZip: undefined,
				fromCountry: undefined,
				fromState: undefined,
				fromCity: undefined,
				fromZip: undefined,
				fromLatitude: undefined,
				fromLongitude: undefined,
			},
		};
		returnData.media = [];

		if(data.message.contents.length>0){
			for (let contentIndex = 0; contentIndex < (data.message.contents.length); contentIndex++) {
				if(data.message.contents[contentIndex].type == 'text'){
					returnData.body += data.message.contents[contentIndex].text;
				} else if(data.message.contents[contentIndex].type == 'file') {
					const media = {
						url: '',
						contentType: '',
					};
					media.url = data.message.contents[contentIndex].fileUrl;
					media.contentType = data.message.contents[contentIndex].fileMimeType;
					
					if(data.message.contents[contentIndex].hasOwnProperty('fileCaption')){
						returnData.body += data.message.contents[contentIndex].fileCaption;
					}

					returnData.media.push(media);
				} else if(data.message.contents[contentIndex].type == 'contacts') {
					// Right now this type of content can not be "read"
					returnData.body += TAPi18n.__('Visitor_sent_contact', { defaultLanguage });
				} else if(data.message.contents[contentIndex].type == 'json'
						&& data.message.contents[contentIndex].payload.latitude
						&& data.message.contents[contentIndex].payload.longitude) {
					// Right now this type of content can not be "read"
					returnData.extra.fromLatitude  = data.message.contents[contentIndex].payload.latitude;
					returnData.extra.fromLongitude = data.message.contents[contentIndex].payload.longitude;
				}
			}
		}

		return returnData;
	}

	send(fromNumber, toNumber, message, extraData) {
		const client = new zenvia.Client(this.apiToken);
		const channel = client.getChannel(this.channel);
		const content = new zenvia.TextContent(message);
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
				return console.error(`(Zenvia) -> ${ reason }`);
			}

			// Send attachment first
			const fileContent = new zenvia.FileContent(publicFilePath, type);
			channel.sendMessage(this.from, toNumber, fileContent)
			.then(response => {
			// do something here
			})
			.catch(error => {
			// handle error here
				notifyAgent(userId, rid, error);
			});
		}
		
		channel.sendMessage(this.from, toNumber, content)
		.then(response => {
		// do something here
		})
		.catch(error => {
			notifyAgent(userId, rid, error);
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

SMS.registerService('zenvia', Zenvia);
