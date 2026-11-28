import { describe, it, before, beforeEach, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const findOneByEmailAddress = sinon.stub();
const sendResetPasswordEmail = sinon.stub().resolves();
const settingsGet = sinon.stub();

let sendForgotPasswordEmail: any;

before(async () => {
	mock.module('../../lib/auth/accountEmails', { exports: { sendResetPasswordEmail } });
	mock.module('../../lib/logger/system', { exports: { SystemLogger: { error: sinon.stub() } } });
	mock.module('../../settings', { exports: { settings: { get: settingsGet } } });
	({ sendForgotPasswordEmail } = await import('./sendForgotPasswordEmail'));
});

describe('sendForgotPasswordEmail', () => {
	const oauthUser = { _id: 'user-id', services: { saml: {} } };

	before(() => {
		mockModel('Users', { findOneByEmailAddress });
	});

	beforeEach(() => {
		findOneByEmailAddress.reset();
		sendResetPasswordEmail.resetHistory();
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
