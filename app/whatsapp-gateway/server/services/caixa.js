import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../../settings';
import WhatsAppGateway from '../WhatsAppGateway';

class Caixa {
	constructor() {
		this.config = {
			baseApiUrl: settings.get('WhatsApp_Gateway_Base_API_URL'),
			defaultDepartmentName: settings.get('WhatsApp_Gateway_Default_Department'),
			offlineServiceMessage: settings.get('WhatsApp_Gateway_Fallback_Message'),
			allowInvalidSelfSignedCerts: settings.get('WhatsApp_Gateway_Allow_Invalid_SelfSigned_Certs'),
			welcomeMessage: settings.get('WhatsApp_Gateway_Welcome_Message'),
		};
	}

	getConfig() {
		return this.config;
	}

	send(fromNumber, toNumber, message) {
		const {baseApiUrl: baseUrl, allowInvalidSelfSignedCerts } = this.config;

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
			console.error('Error sending message to WhatsAppGateway ->', e);
		}
	}
}

WhatsAppGateway.registerService('caixa', Caixa);
