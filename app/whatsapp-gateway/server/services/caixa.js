import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import filesize from 'filesize';

import { settings } from '../../../settings';
import WhatsAppGateway from '../WhatsAppGateway';
import { Notifications } from '../../../notifications';
import { fileUploadIsValidContentType } from '../../../utils/lib/fileUploadRestrictions';

const notifyAgent = (userId, rid, msg) => Notifications.notifyUser(userId, 'message', {
	_id: Random.id(),
	rid,
	ts: new Date(),
	msg,
});

class Caixa {
	constructor() {
		this.config = {
			baseApiUrl: settings.get('WhatsApp_Gateway_Base_API_URL'),
			defaultDepartmentName: settings.get('WhatsApp_Gateway_Default_Department'),
			offlineServiceMessage: settings.get('WhatsApp_Gateway_Fallback_Message'),
			allowInvalidSelfSignedCerts: settings.get('WhatsApp_Gateway_Allow_Invalid_SelfSigned_Certs'),
			welcomeMessage: settings.get('WhatsApp_Gateway_Welcome_Message'),
			queueMessage: settings.get('WhatsApp_Gateway_Queue_Message'),
			conversationFinishedMessage: settings.get('WhatsApp_Gateway_conversation_finished_message'),
			notificationMessageNotDelivered: settings.get('WhatsApp_Gateway_Notification_Message_Not_Delivered'),
			fileUploadEnabled: settings.get('WhatsApp_Gateway_FileUpload_Enabled'),
			fileUploadMaxFileSize: settings.get('WhatsApp_Gateway_FileUpload_MaxFileSize'),
			fileUploadMediaTypeWhiteList: settings.get('WhatsApp_Gateway_FileUpload_MediaTypeWhiteList'),
		};
	}

	getConfig() {
		return this.config;
	}

	send(fromNumber, toNumber, message, extraData = {}) {
		let { baseApiUrl: baseUrl } = this.config;
		const {
			allowInvalidSelfSignedCerts,
			notificationMessageNotDelivered,
			fileUploadEnabled,
			fileUploadMaxFileSize,
			fileUploadMediaTypeWhiteList,
		} = this.config;

		const { rid, userId, attachment } = extraData;

		if (!baseUrl) {
			throw new Meteor.Error('(WhatsAppGateway)Base API URL is not defined.');
		}

		if (!baseUrl.endsWith('/')) {
			baseUrl = baseUrl.concat('/');
		}

		let midia;
		if (attachment) {
			const user = userId ? Meteor.users.findOne(userId) : null;
			const lng = (user && user.language) || settings.get('Language') || 'en';
			const { type: mime_type, size, dataURI: base64 } = attachment;

			if (!base64) {
				return console.error('(WhatsAppGateway) -> The base64 content is not defined.');
			}

			let reason;
			if (!fileUploadEnabled) {
				reason = TAPi18n.__('FileUpload_Disabled', { lng });
			} else if (fileUploadMaxFileSize > -1 && size > fileUploadMaxFileSize) {
				reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
					size: filesize(fileUploadMaxFileSize),
					lng,
				});
			} else if (!fileUploadIsValidContentType(mime_type, fileUploadMediaTypeWhiteList)) {
				reason = TAPi18n.__('File_type_is_not_accepted', { lng });
			}

			if (reason) {
				rid && userId && notifyAgent(userId, rid, reason);
				return console.error(`(WhatsAppGateway) -> ${ reason }`);
			}

			midia = { mime_type, base64 };
		}

		const options = {
			headers: {
				'Content-Type': 'application/json',
			},
			data: {
				id_cliente: toNumber,
				id_caixa: fromNumber,
				texto: message,
				...midia && { midia },
				// ...token && { token },
			},
			npmRequestOptions: {
				rejectUnauthorized: !allowInvalidSelfSignedCerts,
				strictSSL: !allowInvalidSelfSignedCerts,
			},
		};

		try {
			return HTTP.call('POST', `${ baseUrl }mensagens/enviamensagem`, options);
		} catch (e) {
			const { response: { data } = {} } = e;
			let errorMessage = notificationMessageNotDelivered || 'Error sending message to WhatsAppGateway';
			if (data && data.status && data.status === 404 && data.mensagem) {
				errorMessage = data.mensagem;
			}

			rid && userId && notifyAgent(userId, rid, errorMessage);
			console.error(`${ errorMessage } -> ${ e }`);
		}
	}
}

WhatsAppGateway.registerService('caixa', Caixa);
