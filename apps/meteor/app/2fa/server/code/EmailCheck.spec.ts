import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

const { settingsMock } = vi.hoisted(() => {
	const sinon = require('sinon');
	return { settingsMock: sinon.stub() };
});

vi.mock('@rocket.chat/models', () => ({ Users: {} }));
vi.mock('meteor/accounts-base', () => ({ Accounts: { _bcryptRounds: () => '123' } }));
vi.mock('../../../../server/lib/i18n', () => ({ i18n: { t: (key: string) => key } }));
vi.mock('../../../mailer/server/api', () => ({ send: () => undefined }));
vi.mock('../../../settings/server', () => ({ settings: { get: settingsMock } }));

const { EmailCheck } = await import('./EmailCheck');

const normalUserMock = {
	services: { email2fa: { enabled: true } },
	emails: [{ email: 'abc@gmail.com', verified: true }],
} as unknown as IUser;
const normalUserWithUnverifiedEmailMock = {
	services: { email2fa: { enabled: true } },
	emails: [{ email: 'abc@gmail.com', verified: false }],
} as unknown as IUser;
const OAuthUserMock = { services: { google: {} }, emails: [{ email: 'abc@gmail.com', verified: true }] } as unknown as IUser;

describe('EmailCheck', () => {
	let emailCheck: InstanceType<typeof EmailCheck>;
	beforeEach(() => {
		settingsMock.reset();

		emailCheck = new EmailCheck();
	});

	it('should return EmailCheck is enabled for a normal user', () => {
		settingsMock.returns(true);

		const isEmail2FAEnabled = emailCheck.isEnabled(normalUserMock);

		expect(isEmail2FAEnabled).to.be.equal(true);
	});

	it('should return EmailCheck is not enabled for a normal user with unverified email', () => {
		settingsMock.returns(true);

		const isEmail2FAEnabled = emailCheck.isEnabled(normalUserWithUnverifiedEmailMock);

		expect(isEmail2FAEnabled).to.be.equal(false);
	});

	it('should return EmailCheck is not enabled for a OAuth user with setting being false', () => {
		settingsMock.returns(true);

		const isEmail2FAEnabled = emailCheck.isEnabled(OAuthUserMock);

		expect(isEmail2FAEnabled).to.be.equal(false);
	});
});
