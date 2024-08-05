import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const isOAuthUserMock = sinon.stub();
const settingsMock = sinon.stub();

const { EmailCheck } = proxyquire.noCallThru().load('./EmailCheck', {
	'@rocket.chat/core-typings': {
		isOAuthUser: isOAuthUserMock,
	},
	'@rocket.chat/models': {
		Users: {},
	},
	'meteor/accounts-base': {
		Accounts: {
			_bcryptRounds: () => '123',
		},
	},
	'../../../../server/lib/i18n': {
		i18n: {
			t: (key: string) => key,
		},
	},
	'../../../mailer/server/api': {
		send: () => undefined,
	},
	'../../../settings/server': {
		settings: {
			get: settingsMock,
		},
	},
});

const normalUserMock = { services: { email2fa: { enabled: true } }, emails: [{ email: 'abc@gmail.com', verified: true }] };
const normalUserWithUnverifiedEmailMock = {
	services: { email2fa: { enabled: true } },
	emails: [{ email: 'abc@gmail.com', verified: false }],
};
const OAuthUserMock = { services: { google: {} }, emails: [{ email: 'abc@gmail.com', verified: true }] };

describe('EmailCheck', () => {
	let emailCheck: typeof EmailCheck;
	beforeEach(() => {
		isOAuthUserMock.reset();
		settingsMock.reset();

		emailCheck = new EmailCheck();
	});

	it('should return EmailCheck is enabled for a normal user', () => {
		isOAuthUserMock.returns(false);
		settingsMock.returns(true);

		const isEmail2FAEnabled = emailCheck.isEnabled(normalUserMock);

		expect(isEmail2FAEnabled).to.be.equal(true);
	});

	it('should return EmailCheck is not enabled for a normal user with unverified email', () => {
		isOAuthUserMock.returns(false);
		settingsMock.returns(true);

		const isEmail2FAEnabled = emailCheck.isEnabled(normalUserWithUnverifiedEmailMock);

		expect(isEmail2FAEnabled).to.be.equal(false);
	});

	it('should return EmailCheck is not enabled for a OAuth user with setting being false', () => {
		isOAuthUserMock.returns(false);
		settingsMock.onFirstCall().returns(true);
		settingsMock.onSecondCall().returns(true);

		const isEmail2FAEnabled = emailCheck.isEnabled(OAuthUserMock);

		expect(isEmail2FAEnabled).to.be.equal(false);
	});
});
