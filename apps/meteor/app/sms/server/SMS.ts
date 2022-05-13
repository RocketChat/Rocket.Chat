import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';

// Here, i wanted to use: Record<`MediaContentType${number}` | `MediaUrl${number}`, string> instead of the index sig, but it doesnt work on our ts version :(
export type UnparsedData = { [k: string]: string } & {
	from: string;
	to: string;
	NumMedia: string;
	content: string;
};

export type ParsedData = {
	from: string;
	to: string;
	body: string;
	media: { url: string; contentType: string }[];
};

export abstract class SMSServiceClass {
	abstract parse(data: UnparsedData): ParsedData;

	abstract send(
		fromNumber: string,
		toNumber: string,
		message: string,
		username?: string,
		password?: string,
		address?: string,
	): { isSuccess: boolean; resultMsg: string };

	abstract sendBatch(
		fromNumber: string,
		toNumbersArr: string[],
		message: string,
	): Promise<{ isSuccess: boolean; resultMsg: string; response: HTTP.HTTPResponse | null }>;

	abstract response(): { headers: { [key: string]: string }; body: string };

	abstract error(err: Error & { reason?: string }): { headers: { [key: string]: string }; body: string };
}
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
