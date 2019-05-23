import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

export default WhatsAppGateway = {
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

	getParams(name) {
		return this.getService(name).getParams();
	}
};

settings.get('WhatsApp_Gateway_Enabled', function(key, value) {
	WhatsAppGateway.enabled = value;
});
