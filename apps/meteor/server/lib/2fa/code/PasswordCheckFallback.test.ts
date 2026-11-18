import { before, beforeEach, describe, it } from 'node:test';

import { hashPassword } from '@rocket.chat/account-utils';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import * as compareUserPasswordModule from '../../compareUserPassword';

const settingsGet = sinon.stub();
const compareUserPassword = sinon.spy(compareUserPasswordModule.compareUserPassword);

const { PasswordCheckFallback } = proxyquire.noCallThru().load('./PasswordCheckFallback', {
	'../../compareUserPassword': { compareUserPassword },
	'../../../settings': { settings: { get: settingsGet } },
});

const userWithPassword = { _id: 'user-id', services: { password: { bcrypt: '' } } };
const userWithoutPassword = { _id: 'sso-user-id', services: {} };

describe('PasswordCheckFallback', () => {
	before(async () => {
		userWithPassword.services.password.bcrypt = await hashPassword({ digest: 'abcdef', algorithm: 'sha-256' });
	});

	beforeEach(() => {
		settingsGet.reset();
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback').returns(true);
		compareUserPassword.resetHistory();
	});

	it('should apply only to users with a password when the fallback is enforced', () => {
		const fallback = new PasswordCheckFallback();

		expect(fallback.isEnabled(userWithPassword, false)).to.be.true;
		expect(fallback.isEnabled(userWithoutPassword, false)).to.be.false;
	});

	it('should not apply to a user with no services', () => {
		expect(new PasswordCheckFallback().isEnabled({ _id: 'sso-user-id' }, false)).to.be.false;
	});

	it('should not apply when the fallback is not enforced and no second factor is required', () => {
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback').returns(false);

		expect(new PasswordCheckFallback().isEnabled(userWithPassword, false)).to.be.false;
	});

	it('should apply when a second factor is required even if the fallback is not enforced', () => {
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback').returns(false);

		expect(new PasswordCheckFallback().isEnabled(userWithoutPassword, true)).to.be.true;
	});

	it('should accept the password digest whatever its letter case', async () => {
		expect(await new PasswordCheckFallback().verify(userWithPassword, 'ABCDEF', false)).to.be.true;
		expect(compareUserPassword.calledOnceWith(userWithPassword, { sha256: 'ABCDEF' })).to.be.true;
	});

	it('should refuse a wrong password', async () => {
		expect(await new PasswordCheckFallback().verify(userWithPassword, 'fedcba', false)).to.be.false;
	});

	it('should refuse without checking the password when the fallback does not apply', async () => {
		expect(await new PasswordCheckFallback().verify(userWithoutPassword, 'abcdef', false)).to.be.false;
		expect(compareUserPassword.called).to.be.false;
	});

	it('should answer to the password method, send nothing after a wrong password and leave limits to the rate limiter', async () => {
		const fallback = new PasswordCheckFallback();

		expect(fallback.name).to.equal('password');
		expect(await fallback.processInvalidCode()).to.deep.equal({ codeGenerated: false });
		expect(await fallback.maxFaildedAttemtpsReached()).to.be.false;
	});
});
