import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';

export const SMS = {
	enabled: false,
	department: null,
	service: null,
	services: {},
	accountSid: null,
	authToken: null,
	fromNumber: null,

	registerService(name, service) {
		this.services[name] = service;
	},

	getService(name) {
		if (!this.enabled) {
			throw new Meteor.Error('error-sms-service-disabled');
		}
		if (!this.services[name.toLowerCase()]) {
			throw new Meteor.Error('error-sms-service-not-configured');
		}
		return new this.services[name.toLowerCase()](this.accountSid, this.authToken, this.fromNumber);
	},

	isConfiguredService(name) {
		// this.service is already lowercased here
		return name.toLowerCase() === this.service;
	},
};

settings.watch('SMS_Enabled', function (value) {
	SMS.enabled = value;
});

settings.watch('SMS_Default_Omnichannel_Department', function (value) {
	SMS.department = value;
});

settings.watch('SMS_Service', (value) => {
	SMS.service = value.toLowerCase();
});
