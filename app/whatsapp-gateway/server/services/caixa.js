import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../../settings';
import WhatsAppGateway from '../WhatsAppGateway';
import { Notifications } from '../../../notifications';

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
		};
	}

	getConfig() {
		return this.config;
	}

	send(fromNumber, toNumber, message, extraData = {}) {
		let { baseApiUrl: baseUrl } = this.config;
		const { allowInvalidSelfSignedCerts } = this.config;

		if (!baseUrl) {
			throw new Meteor.Error('(WhatsAppGateway)Base API URL is not defined.');
		}

		if (!baseUrl.endsWith('/')) {
			baseUrl = baseUrl.concat('/');
		}

		const options = {
			headers: {
				'Content-Type': 'application/json',
			},
			data: {
				id_cliente: toNumber,
				id_caixa: fromNumber,
				texto: message,
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
			const { notificationMessageNotDelivered } = this.config;

			let errorMessage = notificationMessageNotDelivered || 'Error sending message to WhatsAppGateway';
			if (data && data.status && data.status === 404 && data.mensagem) {
				errorMessage = data.mensagem;
			}

			const { rid, userId } = extraData;
			rid && userId && Notifications.notifyUser(userId, 'message', {
				_id: Random.id(),
				rid,
				ts: new Date(),
				msg: errorMessage,
			});

			console.error(`${ errorMessage } -> ${ e }`);
		}
	}
}

WhatsAppGateway.registerService('caixa', Caixa);
