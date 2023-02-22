import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import type { ISMSProvider, ISMSProviderConstructor } from './types';

type SMSWorker = {
	enabled: boolean;
	department: string | null;
	service: string | null;
	services: Record<string, ISMSProviderConstructor>;
	accountSid: string | null;
	authToken: string | null;
	fromNumber: string | null;

	registerService(name: string, service: ISMSProviderConstructor): void;
	getService(name: string): ISMSProvider;
	isConfiguredService(name: string): boolean;
};

export const SMS: SMSWorker = {
	enabled: false,
	department: null,
	service: null,
	services: {},
	accountSid: null,
	authToken: null,
	fromNumber: null,

	registerService(name: string, service: ISMSProviderConstructor) {
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

settings.watch<boolean>('SMS_Enabled', function (value) {
	SMS.enabled = value;
});

settings.watch<string>('SMS_Default_Omnichannel_Department', function (value) {
	SMS.department = value;
});

settings.watch<string>('SMS_Service', (value) => {
	SMS.service = value.toLowerCase();
});
