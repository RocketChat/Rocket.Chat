import bcrypt from 'bcrypt';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsMock = sinon.stub();
const usersMock = {
	addEmailCodeByUserId: sinon.stub(),
	maxInvalidEmailCodeAttemptsReached: sinon.stub(),
	removeEmailCodeOfUserId: sinon.stub(),
	removeExpiredEmailCodeOfUserId: sinon.stub(),
};
const sendMock = sinon.stub();

const { EmailCheck } = proxyquire.noCallThru().load('./EmailCheck', {
	'@rocket.chat/models': {
		Users: usersMock,
	},
	'meteor/accounts-base': {
		Accounts: {
			_bcryptRounds: () => 4,
		},
	},
	'../../i18n': {
		i18n: {
			t: (key: string) => key,
			getFixedT: () => (key: string) => key,
		},
	},
	'../../notifications/email/api': {
		send: sendMock,
	},
	'../../../settings': {
		settings: {
			get: settingsMock,
		},
	},
});

const normalUserMock = { services: { email2fa: { enabled: true } }, emails: [{ address: 'abc@gmail.com', verified: true }] };
const normalUserWithUnverifiedEmailMock = {
	services: { email2fa: { enabled: true } },
	emails: [{ email: 'abc@gmail.com', verified: false }],
};
const OAuthUserMock = { services: { google: {} }, emails: [{ email: 'abc@gmail.com', verified: true }] };

describe('EmailCheck', () => {
	let emailCheck: typeof EmailCheck;
	beforeEach(() => {
		settingsMock.reset();
		Object.values(usersMock).forEach((stub) => stub.reset());
		sendMock.reset();

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

	describe('sendEmailCode', () => {
		const user = { ...normalUserMock, _id: 'user-id' };

		beforeEach(() => {
			settingsMock.withArgs('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration').returns('3600');
		});

		it('should send a new code when no code was sent in the last minute', async () => {
			usersMock.addEmailCodeByUserId.resolves({ modifiedCount: 1 });

			expect(await emailCheck.sendEmailCode(user)).to.be.equal(true);
			expect(sendMock.calledOnceWith(sinon.match({ to: 'abc@gmail.com' }))).to.be.equal(true);
		});

		it('should not send a code when one was sent in the last minute', async () => {
			usersMock.addEmailCodeByUserId.resolves({ modifiedCount: 0 });

			expect(await emailCheck.sendEmailCode(user)).to.be.equal(false);
			expect(sendMock.called).to.be.equal(false);
			const notSentSince: Date = usersMock.addEmailCodeByUserId.firstCall.args[3];
			expect(Date.now() - notSentSince.getTime()).to.be.closeTo(60_000, 1_000);
		});

		it('should tell the login that no code was generated while the cooldown holds', async () => {
			settingsMock.withArgs('Accounts_TwoFactorAuthentication_Max_Invalid_Email_Code_Attempts').returns(5);
			usersMock.maxInvalidEmailCodeAttemptsReached.resolves(true);
			usersMock.addEmailCodeByUserId.resolves({ modifiedCount: 0 });

			expect(await emailCheck.processInvalidCode(user)).to.include({ codeGenerated: false });
			expect(sendMock.called).to.be.equal(false);
		});
	});

	it('should reject a correct code after the invalid attempts limit is reached', async () => {
		settingsMock.returns(true);
		settingsMock.withArgs('Accounts_TwoFactorAuthentication_Max_Invalid_Email_Code_Attempts').returns(5);
		const user = {
			...normalUserMock,
			_id: 'user-id',
			services: {
				...normalUserMock.services,
				emailCode: { code: await bcrypt.hash('123456', 4), expire: new Date(Date.now() + 60_000), attempts: 5 },
			},
		};

		expect(await emailCheck.verify(user, '123456')).to.be.equal(false);
		expect(usersMock.removeEmailCodeOfUserId.called).to.be.equal(false);
	});
});
