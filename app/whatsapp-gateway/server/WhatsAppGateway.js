import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

const WhatsAppGateway = {
	enabled: false,
	services: {},

	registerService(name, service) {
		this.services[name] = service;
	},

	getService(name) {
		if (!this.services[name]) {
			throw new Meteor.Error('error-whatsapp-gateway-service-not-configured');
		}
		return new this.services[name]();
	},
};

settings.get('WhatsApp_Gateway_Enabled', function(key, value) {
	WhatsAppGateway.enabled = value;
});

export default WhatsAppGateway;
