import crypto from 'crypto';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsStub = {
	get: sinon.stub(),
};

const twilioStub = {
	validateRequest: sinon.stub(),
	isRequestFromTwilio: sinon.stub(),
};

const { Twilio } = proxyquire.noCallThru().load('../../../../../../server/services/omnichannel-integrations/providers/twilio.ts', {
	'../../../../app/settings/server': { settings: settingsStub },
	'../../../../app/utils/server/restrictions': { fileUploadIsValidContentType: sinon.stub() },
	'../../../lib/i18n': { i18n: sinon.stub() },
	'../../../lib/logger/system': { SystemLogger: { error: sinon.stub() } },
});

/**
 * Get a valid Twilio signature for a request
 *
 * @param {String} authToken your Twilio AuthToken
 * @param {String} url your webhook URL
 * @param {Object} params the included request parameters
 */
function getSignature(authToken: string, url: string, params: Record<string, any>): string {
	// get all request parameters
	const data = Object.keys(params)
		// sort them
		.sort()
		// concatenate them to a string

		.reduce((acc, key) => acc + key + params[key], url);

	return (
		crypto
			// sign the string with sha1 using your AuthToken
			.createHmac('sha1', authToken)
			.update(Buffer.from(data, 'utf-8'))
			// base64 encode it
			.digest('base64')
	);
}

describe('Twilio Request Validation', () => {
	beforeEach(() => {
		settingsStub.get.reset();
		twilioStub.validateRequest.reset();
		twilioStub.isRequestFromTwilio.reset();
	});

	it('should not validate a request when process.env.TEST_MODE is true', async () => {
		process.env.TEST_MODE = 'true';

		const twilio = new Twilio();
		const request = {
			headers: {
				'x-twilio-signature': 'test',
			},
		};

		expect(await twilio.validateRequest(request)).to.be.true;
	});

	it('should validate a request when process.env.TEST_MODE is false', async () => {
		process.env.TEST_MODE = 'false';

		settingsStub.get.withArgs('SMS_Twilio_authToken').returns('test');
		settingsStub.get.withArgs('Site_Url').returns('https://example.com');

		const twilio = new Twilio();
		const requestBody = {
			To: 'test',
			From: 'test',
			Body: 'test',
		};

		const request = {
			headers: {
				get: (param: string) => {
					const headers: Record<string, any> = {
						'x-twilio-signature': getSignature('test', 'https://example.com/api/v1/livechat/sms-incoming/twilio', requestBody),
					};

					return headers[param];
				},
			},
			json: () => requestBody,
		};

		expect(await twilio.validateRequest(request)).to.be.true;
	});

	it('should validate a request when query string is present', async () => {
		process.env.TEST_MODE = 'false';

		settingsStub.get.withArgs('SMS_Twilio_authToken').returns('test');
		settingsStub.get.withArgs('Site_Url').returns('https://example.com/');

		const twilio = new Twilio();
		const requestBody = {
			To: 'test',
			From: 'test',
			Body: 'test',
		};

		const request = {
			url: '/api/v1/livechat/sms-incoming/twilio?department=1',
			headers: {
				get: (param: string) => {
					const headers: Record<string, any> = {
						'x-twilio-signature': getSignature('test', 'https://example.com/api/v1/livechat/sms-incoming/twilio?department=1', requestBody),
					};

					return headers[param];
				},
			},
			json: () => requestBody,
		};

		expect(await twilio.validateRequest(request)).to.be.true;
	});

	it('should reject a request where signature doesnt match', async () => {
		settingsStub.get.withArgs('SMS_Twilio_authToken').returns('test');
		settingsStub.get.withArgs('Site_Url').returns('https://example.com');

		const twilio = new Twilio();
		const requestBody = {
			To: 'test',
			From: 'test',
			Body: 'test',
		};

		const request = {
			headers: {
				get: (param: string) => {
					const headers: Record<string, any> = {
						'x-twilio-signature': getSignature('anotherAuthToken', 'https://example.com/api/v1/livechat/sms-incoming/twilio', requestBody),
					};

					return headers[param];
				},
			},
			json: () => requestBody,
		};

		expect(await twilio.validateRequest(request)).to.be.false;
	});

	it('should reject a request where signature is missing', async () => {
		settingsStub.get.withArgs('SMS_Twilio_authToken').returns('test');
		settingsStub.get.withArgs('Site_Url').returns('https://example.com');

		const twilio = new Twilio();
		const requestBody = {
			To: 'test',
			From: 'test',
			Body: 'test',
		};

		const request = {
			headers: {
				get: () => null,
			},
			json: () => requestBody,
		};

		expect(await twilio.validateRequest(request)).to.be.false;
	});

	it('should reject a request where the signature doesnt correspond body', async () => {
		settingsStub.get.withArgs('SMS_Twilio_authToken').returns('test');
		settingsStub.get.withArgs('Site_Url').returns('https://example.com');

		const twilio = new Twilio();
		const requestBody = {
			To: 'test',
			From: 'test',
			Body: 'test',
		};

		const request = {
			headers: {
				get: (param: string) => {
					const headers: Record<string, any> = {
						'x-twilio-signature': getSignature('test', 'https://example.com/api/v1/livechat/sms-incoming/twilio', {}),
					};

					return headers[param];
				},
			},
			json: () => requestBody,
		};

		expect(await twilio.validateRequest(request)).to.be.false;
	});

	it('should return false if URL is not provided', async () => {
		process.env.TEST_MODE = 'false';

		settingsStub.get.withArgs('SMS_Twilio_authToken').returns('test');
		settingsStub.get.withArgs('Site_Url').returns('');

		const twilio = new Twilio();
		const requestBody = {
			To: 'test',
			From: 'test',
			Body: 'test',
		};

		const request = {
			headers: {
				get: (param: string) => {
					const headers: Record<string, any> = {
						'x-twilio-signature': getSignature('test', 'https://example.com/api/v1/livechat/sms-incoming/twilio', requestBody),
					};

					return headers[param];
				},
			},
			json: () => requestBody,
		};

		expect(await twilio.validateRequest(request)).to.be.false;
	});

	it('should return false if authToken is not provided', async () => {
		process.env.TEST_MODE = 'false';

		settingsStub.get.withArgs('SMS_Twilio_authToken').returns('');
		settingsStub.get.withArgs('Site_Url').returns('https://example.com');

		const twilio = new Twilio();
		const requestBody = {
			To: 'test',
			From: 'test',
			Body: 'test',
		};

		const request = {
			headers: {
				get: (param: string) => {
					const headers: Record<string, any> = {
						'x-twilio-signature': getSignature('test', 'https://example.com/api/v1/livechat/sms-incoming/twilio', requestBody),
					};

					return headers[param];
				},
			},
			json: () => requestBody,
		};

		expect(await twilio.validateRequest(request)).to.be.false;
	});
});
