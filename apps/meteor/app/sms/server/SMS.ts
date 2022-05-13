import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';

export class SMSServiceClass {}
export interface ISMSService {
	new (): SMSServiceClass;
}

export const SMS = {
	enabled: false,
	department: '',
	services: {} as { [key: string]: ISMSService },
	accountSid: '',
	authToken: '',
	fromNumber: '',

	registerService(name: string, service: ISMSService): void {
		this.services[name] = service;
	},

	getService(name: string): SMSServiceClass {
		if (!this.services[name]) {
			throw new Meteor.Error('error-sms-service-not-configured');
		}

		// looks like none of the params injected here were actually used by the underlying services
		return new this.services[name]();
	},
};

settings.watch<boolean>('SMS_Enabled', function (value) {
	SMS.enabled = value;
});

settings.watch<string>('SMS_Default_Omnichannel_Department', function (value) {
	SMS.department = value;
});
