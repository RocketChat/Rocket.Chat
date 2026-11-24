import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const UNVERIFIED_EMAIL_REASON = 'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password';

const Users = {
	findOneByEmailAddress: sinon.stub(),
	unsetPassword: sinon.stub(),
	setServiceId: sinon.stub(),
	setEmailVerified: sinon.stub(),
	unsetRequirePasswordChangeWithoutPassword: sinon.stub(),
};

const originalUpdateOrCreate = sinon.stub();
const Accounts: { updateOrCreateUserFromExternalService: (...args: any[]) => Promise<unknown> } = {
	updateOrCreateUserFromExternalService: originalUpdateOrCreate,
};

const { configureAccounts } = proxyquire.noCallThru().load('./accounts_meld', {
	'@rocket.chat/models': { Users },
	'meteor/accounts-base': { Accounts },
});

const login = (serviceName: string, serviceData: Record<string, unknown>) =>
	Accounts.updateOrCreateUserFromExternalService(serviceName, serviceData, {});

describe('configureAccounts (accounts meld)', () => {
	beforeEach(async () => {
		Object.values(Users).forEach((stub) => stub.reset());
		originalUpdateOrCreate.reset();
		originalUpdateOrCreate.resolves({ userId: 'user-id' });
		Accounts.updateOrCreateUserFromExternalService = originalUpdateOrCreate;
		await configureAccounts();
	});

	it('should not touch users of services that are not melded', async () => {
		await login('saml', { email: 'user@example.com', id: 'abc' });

		expect(Users.findOneByEmailAddress.called).to.be.false;
		expect(originalUpdateOrCreate.calledOnce).to.be.true;
	});

	it('should drop the local password without requiring a password change when the email is not verified', async () => {
		Users.findOneByEmailAddress.resolves({
			_id: 'user-id',
			emails: [{ address: 'user@example.com', verified: false }],
			services: { password: { bcrypt: 'hash' } },
		});

		await login('authentik', { _OAuthCustom: true, email: 'user@example.com', id: 'sub-1' });

		expect(Users.unsetPassword.calledOnceWith('user-id')).to.be.true;
		expect(Users.setServiceId.calledOnceWith('user-id', 'authentik', 'sub-1')).to.be.true;
		expect(Users.setEmailVerified.calledOnceWith('user-id', 'user@example.com')).to.be.true;
		expect(Users.unsetRequirePasswordChangeWithoutPassword.called).to.be.false;
		expect(originalUpdateOrCreate.calledOnce).to.be.true;
	});

	it('should keep the password when the email is verified, ignoring the address case', async () => {
		Users.findOneByEmailAddress.resolves({
			_id: 'user-id',
			emails: [{ address: 'user@example.com', verified: true }],
			services: { password: { bcrypt: 'hash' } },
		});

		await login('authentik', { _OAuthCustom: true, email: 'User@Example.com', id: 'sub-1' });

		expect(Users.unsetPassword.called).to.be.false;
		expect(Users.setServiceId.calledOnceWith('user-id', 'authentik', 'sub-1')).to.be.true;
		expect(Users.setEmailVerified.calledOnceWith('user-id', 'user@example.com')).to.be.true;
	});

	it('should not meld again when the account is already linked to the same external id', async () => {
		Users.findOneByEmailAddress.resolves({
			_id: 'user-id',
			emails: [{ address: 'user@example.com', verified: false }],
			services: { authentik: { id: 'sub-1' }, password: { bcrypt: 'hash' } },
		});

		await login('authentik', { _OAuthCustom: true, email: 'user@example.com', id: 'sub-1' });

		expect(Users.unsetPassword.called).to.be.false;
		expect(Users.setServiceId.called).to.be.false;
		expect(Users.unsetRequirePasswordChangeWithoutPassword.called).to.be.false;
	});

	it('should release accounts left on the reset password page by a previous meld', async () => {
		Users.findOneByEmailAddress.resolves({
			_id: 'user-id',
			emails: [{ address: 'user@example.com', verified: true }],
			services: { authentik: { id: 'sub-1' } },
			requirePasswordChange: true,
			requirePasswordChangeReason: UNVERIFIED_EMAIL_REASON,
		});

		await login('authentik', { _OAuthCustom: true, email: 'user@example.com', id: 'sub-1' });

		expect(Users.unsetRequirePasswordChangeWithoutPassword.calledOnceWith('user-id', UNVERIFIED_EMAIL_REASON)).to.be.true;
		expect(originalUpdateOrCreate.calledOnce).to.be.true;
	});

	it('should keep a password change requested for other reasons', async () => {
		Users.findOneByEmailAddress.resolves({
			_id: 'user-id',
			emails: [{ address: 'user@example.com', verified: true }],
			services: { authentik: { id: 'sub-1' } },
			requirePasswordChange: true,
			requirePasswordChangeReason: 'You_need_to_change_your_password',
		});

		await login('authentik', { _OAuthCustom: true, email: 'user@example.com', id: 'sub-1' });

		expect(Users.unsetRequirePasswordChangeWithoutPassword.called).to.be.false;
	});

	it('should keep the password when any listed copy of the email is verified', async () => {
		Users.findOneByEmailAddress.resolves({
			_id: 'user-id',
			emails: [
				{ address: 'user@example.com', verified: false },
				{ address: 'User@example.com', verified: true },
			],
			services: { password: { bcrypt: 'hash' } },
		});

		await login('authentik', { _OAuthCustom: true, email: 'user@example.com', id: 'sub-1' });

		expect(Users.unsetPassword.called).to.be.false;
		expect(Users.setServiceId.calledOnceWith('user-id', 'authentik', 'sub-1')).to.be.true;
	});

	it('should keep the meld password change while the account still has a password', async () => {
		Users.findOneByEmailAddress.resolves({
			_id: 'user-id',
			emails: [{ address: 'user@example.com', verified: true }],
			services: { authentik: { id: 'sub-1' }, password: { bcrypt: 'hash' } },
			requirePasswordChange: true,
			requirePasswordChangeReason: UNVERIFIED_EMAIL_REASON,
		});

		await login('authentik', { _OAuthCustom: true, email: 'user@example.com', id: 'sub-1' });

		expect(Users.unsetRequirePasswordChangeWithoutPassword.called).to.be.false;
	});

	it('should release a stuck account whose password entry holds only a reset token', async () => {
		Users.findOneByEmailAddress.resolves({
			_id: 'user-id',
			emails: [{ address: 'user@example.com', verified: true }],
			services: { authentik: { id: 'sub-1' }, password: { reset: { token: 'token', when: new Date() } } },
			requirePasswordChange: true,
			requirePasswordChangeReason: UNVERIFIED_EMAIL_REASON,
		});

		await login('authentik', { _OAuthCustom: true, email: 'user@example.com', id: 'sub-1' });

		expect(Users.unsetRequirePasswordChangeWithoutPassword.calledOnceWith('user-id', UNVERIFIED_EMAIL_REASON)).to.be.true;
	});
});
