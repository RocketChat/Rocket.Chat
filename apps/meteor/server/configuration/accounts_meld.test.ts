import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import mock from 'proxyquire';
import sinon from 'sinon';

const LEGACY_MELD_RESET_REASON = 'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password';

const resetPasswordAndSetRequirePasswordChange = sinon.stub();
const unsetRequirePasswordChange = sinon.stub();
const setServiceId = sinon.stub();
const setEmailVerified = sinon.stub();
const findOneByEmailAddress = sinon.stub();
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
});

describe('accounts_meld', () => {
	beforeEach(async () => {
		AccountsMock.updateOrCreateUserFromExternalService = origUpdateOrCreate;
		resetPasswordAndSetRequirePasswordChange.resetHistory();
		unsetRequirePasswordChange.resetHistory();
		setServiceId.resetHistory();
		setEmailVerified.resetHistory();
		findOneByEmailAddress.reset();
		await configureAccounts();
	});

	it('should clear untrusted password without requiring password change when melding an unverified email', async () => {
		findOneByEmailAddress.resolves({
			_id: 'user-1',
			emails: [{ address: 'user@example.com', verified: false }],
			services: { password: { bcrypt: 'hash' } },
		});

		await AccountsMock.updateOrCreateUserFromExternalService('custom-oidc', {
			_OAuthCustom: true,
			id: 'oidc-123',
			email: 'user@example.com',
		});

		expect(resetPasswordAndSetRequirePasswordChange.calledOnceWith('user-1', false, '')).to.be.true;
		expect(setServiceId.calledOnceWith('user-1', 'custom-oidc', 'oidc-123')).to.be.true;
		expect(setEmailVerified.calledOnceWith('user-1', 'user@example.com')).to.be.true;
	});

	it('should not clear password when email is already verified (case-insensitive)', async () => {
		findOneByEmailAddress.resolves({
			_id: 'user-1',
			emails: [{ address: 'User@Example.com', verified: true }],
			services: { password: { bcrypt: 'hash' } },
		});

		await AccountsMock.updateOrCreateUserFromExternalService('custom-oidc', {
			_OAuthCustom: true,
			id: 'oidc-123',
			email: 'user@example.com',
		});

		expect(resetPasswordAndSetRequirePasswordChange.called).to.be.false;
		expect(setServiceId.calledOnceWith('user-1', 'custom-oidc', 'oidc-123')).to.be.true;
	});

	it('should release already-stuck users with the legacy meld reset reason even when logging in via a different OAuth provider', async () => {
		findOneByEmailAddress.resolves({
			_id: 'user-1',
			requirePasswordChange: true,
			requirePasswordChangeReason: LEGACY_MELD_RESET_REASON,
			emails: [{ address: 'user@example.com', verified: true }],
			services: { github: { id: 'gh-999' } },
		});

		await AccountsMock.updateOrCreateUserFromExternalService('custom-oidc', {
			_OAuthCustom: true,
			id: 'oidc-123',
			email: 'user@example.com',
		});

		expect(unsetRequirePasswordChange.calledOnceWith('user-1')).to.be.true;
	});

	it('should not clear an admin-enforced requirePasswordChange flag with a different reason', async () => {
		findOneByEmailAddress.resolves({
			_id: 'user-1',
			requirePasswordChange: true,
			requirePasswordChangeReason: 'Admin_forced_reset',
			emails: [{ address: 'user@example.com', verified: true }],
			services: { 'custom-oidc': { id: 'oidc-123' } },
		});

		await AccountsMock.updateOrCreateUserFromExternalService('custom-oidc', {
			_OAuthCustom: true,
			id: 'oidc-123',
			email: 'user@example.com',
		});

		expect(unsetRequirePasswordChange.called).to.be.false;
	});
});
