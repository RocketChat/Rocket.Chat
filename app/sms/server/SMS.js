import { Meteor } from 'meteor/meteor';

import { SettingsVersion4 } from '../../settings/server';

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
		const Service = Promise.await(this.services[name]());
		return new Service(this.accountSid, this.authToken, this.fromNumber);
	},
};

SettingsVersion4.watch('SMS_Enabled', function(value) {
	SMS.enabled = value;
});

SettingsVersion4.watch('SMS_Default_Omnichannel_Department', function(value) {
	SMS.department = value;
});
