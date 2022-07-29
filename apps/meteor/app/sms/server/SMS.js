import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';

export const SMS = {
	enabled: false,
	department: null,
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

settings.watch('SMS_Enabled', function (value) {
	SMS.enabled = value;
});

settings.watch('SMS_Default_Omnichannel_Department', function (value) {
	SMS.department = value;
});
