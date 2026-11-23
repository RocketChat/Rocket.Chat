import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import mock from 'proxyquire';
import sinon from 'sinon';

const resetPasswordAndSetRequirePasswordChange = sinon.stub();
const unsetRequirePasswordChange = sinon.stub();
const setServiceId = sinon.stub();
const setEmailVerified = sinon.stub();
const findOneByEmailAddress = sinon.stub();
const settingsGet = sinon.stub();
const origUpdateOrCreate = sinon.stub().resolves({ userId: 'user-1' });

const AccountsMock: {
	updateOrCreateUserFromExternalService: (...args: any[]) => Promise<any>;
} = {
	updateOrCreateUserFromExternalService: origUpdateOrCreate,
};

const { configureAccounts } = mock.noCallThru().load('./accounts_meld', {
	'@rocket.chat/models': {
		Users: {
			findOneByEmailAddress,
			resetPasswordAndSetRequirePasswordChange,
			unsetRequirePasswordChange,
			setServiceId,
			setEmailVerified,
		},
	},
	'meteor/accounts-base': {
		Accounts: AccountsMock,
	},
	'../settings': {
		settings: {
			get: settingsGet,
		},
	},
});

describe('accounts_meld', () => {
	beforeEach(async () => {
		AccountsMock.updateOrCreateUserFromExternalService = origUpdateOrCreate;
		resetPasswordAndSetRequirePasswordChange.resetHistory();
		unsetRequirePasswordChange.resetHistory();
		setServiceId.resetHistory();
		setEmailVerified.resetHistory();
		findOneByEmailAddress.reset();
		settingsGet.reset();
		await configureAccounts();
	});

	it('should not reset password for Custom OIDC users when Accounts_Verify_Email_For_External_Accounts is enabled', async () => {
		findOneByEmailAddress.resolves({
			_id: 'user-1',
			emails: [{ address: 'user@example.com', verified: false }],
			services: { password: { bcrypt: 'hash' } },
		});
		settingsGet.withArgs('Accounts_Verify_Email_For_External_Accounts').returns(true);
		settingsGet.withArgs('Accounts_AllowPasswordChange').returns(false);
		settingsGet.withArgs('Accounts_AllowPasswordChangeForOAuthUsers').returns(false);

		await AccountsMock.updateOrCreateUserFromExternalService('custom-oidc', {
			_OAuthCustom: true,
			id: 'oidc-123',
			email: 'user@example.com',
		});

		expect(resetPasswordAndSetRequirePasswordChange.called).to.be.false;
		expect(setServiceId.calledOnceWith('user-1', 'custom-oidc', 'oidc-123')).to.be.true;
		expect(setEmailVerified.calledOnceWith('user-1', 'user@example.com')).to.be.true;
	});

	it('should clear untrusted password without requiring password change when external email is unverified', async () => {
		findOneByEmailAddress.resolves({
			_id: 'user-1',
			emails: [{ address: 'user@example.com', verified: false }],
			services: { password: { bcrypt: 'hash' } },
		});
		settingsGet.withArgs('Accounts_Verify_Email_For_External_Accounts').returns(false);
		settingsGet.withArgs('Accounts_AllowPasswordChange').returns(true);
		settingsGet.withArgs('Accounts_AllowPasswordChangeForOAuthUsers').returns(true);

		await AccountsMock.updateOrCreateUserFromExternalService('custom-oidc', {
			_OAuthCustom: true,
			id: 'oidc-123',
			email: 'user@example.com',
		});

		expect(resetPasswordAndSetRequirePasswordChange.calledOnce).to.be.true;
		expect(resetPasswordAndSetRequirePasswordChange.firstCall.args[0]).to.equal('user-1');
		expect(resetPasswordAndSetRequirePasswordChange.firstCall.args[1]).to.be.false;
	});

	it('should release already-stuck users who have requirePasswordChange without a password hash on subsequent OAuth login', async () => {
		findOneByEmailAddress.resolves({
			_id: 'user-1',
			requirePasswordChange: true,
			emails: [{ address: 'user@example.com', verified: true }],
			services: { 'custom-oidc': { id: 'oidc-123' } },
		});

		await AccountsMock.updateOrCreateUserFromExternalService('custom-oidc', {
			_OAuthCustom: true,
			id: 'oidc-123',
			email: 'user@example.com',
		});

		expect(unsetRequirePasswordChange.calledOnceWith('user-1')).to.be.true;
	});

	it('should match verified email case-insensitively without resetting password', async () => {
		findOneByEmailAddress.resolves({
			_id: 'user-1',
			emails: [{ address: 'User@Example.com', verified: true }],
			services: { password: { bcrypt: 'hash' } },
		});
		settingsGet.withArgs('Accounts_Verify_Email_For_External_Accounts').returns(false);
		settingsGet.withArgs('Accounts_AllowPasswordChange').returns(true);
		settingsGet.withArgs('Accounts_AllowPasswordChangeForOAuthUsers').returns(true);

		await AccountsMock.updateOrCreateUserFromExternalService('custom-oidc', {
			_OAuthCustom: true,
			id: 'oidc-123',
			email: 'user@example.com',
		});

		expect(resetPasswordAndSetRequirePasswordChange.called).to.be.false;
	});
});
