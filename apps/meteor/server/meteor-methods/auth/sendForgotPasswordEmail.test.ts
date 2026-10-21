import { describe, it, beforeEach } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findOneByEmailAddress = sinon.stub();
const sendResetPasswordEmail = sinon.stub();
const settingsGet = sinon.stub();

const { sendForgotPasswordEmail } = proxyquire.noCallThru().load('./sendForgotPasswordEmail', {
	'@rocket.chat/models': { Users: { findOneByEmailAddress } },
	'meteor/accounts-base': { Accounts: { sendResetPasswordEmail } },
	'../../lib/logger/system': { SystemLogger: { error: sinon.stub() } },
	'../../settings': { settings: { get: settingsGet } },
});

describe('sendForgotPasswordEmail', () => {
	const oauthUser = { _id: 'user-id', services: { saml: {} } };

	beforeEach(() => {
		findOneByEmailAddress.reset();
		sendResetPasswordEmail.reset();
		settingsGet.reset();
	});

	it('should not send the reset email to an OAuth user when password change for OAuth users is disabled', async () => {
		findOneByEmailAddress.resolves(oauthUser);
		settingsGet.withArgs('Accounts_AllowPasswordChangeForOAuthUsers').returns(false);

		expect(await sendForgotPasswordEmail('OAuthUser@Example.com ')).to.be.false;
		expect(sendResetPasswordEmail.called).to.be.false;
	});

	it('should send the reset email to an OAuth user when password change for OAuth users is enabled', async () => {
		findOneByEmailAddress.resolves(oauthUser);
		settingsGet.withArgs('Accounts_AllowPasswordChangeForOAuthUsers').returns(true);

		expect(await sendForgotPasswordEmail('OAuthUser@Example.com ')).to.be.true;
		expect(sendResetPasswordEmail.calledOnceWith('user-id', 'oauthuser@example.com')).to.be.true;
	});
});
