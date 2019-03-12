import { Meteor } from 'meteor/meteor';
import { settings } from '/app/settings';

export const SMS = {
	enabled: false,
	services: {},
	accountSid: null,
	authToken: null,
	fromNumber: null,

	registerService(name, service) {
		this.services[name] = service;
	},

	getService(name) {
		if (!this.services[name]) {
			throw new Meteor.Error('error-sms-service-not-configured');
		}
		return new this.services[name](this.accountSid, this.authToken, this.fromNumber);
	},
};

settings.get('SMS_Enabled', function(key, value) {
	SMS.enabled = value;
});
