import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const checkPassword = sinon.stub();

let PasswordCheckFallback: any;

before(async () => {
	const moduleMocks = [
		mock.module('../../compareUserPassword', { exports: { compareUserPassword: checkPassword } }),
		mock.module('../../../settings', { exports: { settings: { get: settingsGet } } }),
	];
	({ PasswordCheckFallback } = await import('./PasswordCheckFallback'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const userWithPassword = { _id: 'user-id', services: { password: { bcrypt: 'hashed' } } };
const userWithoutPassword = { _id: 'sso-user-id', services: {} };

describe('PasswordCheckFallback', () => {
	beforeEach(() => {
		settingsGet.reset();
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback').returns(true);
		checkPassword.reset();
		checkPassword.resolves(true);
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

	it('should check the code as the SHA-256 digest of the password', async () => {
		expect(await new PasswordCheckFallback().verify(userWithPassword, 'ABCDEF', false)).to.be.true;
		expect(checkPassword.calledOnceWith(userWithPassword, { sha256: 'ABCDEF' })).to.be.true;
	});

	it('should refuse a wrong password', async () => {
		checkPassword.resolves(false);

		expect(await new PasswordCheckFallback().verify(userWithPassword, 'abcdef', false)).to.be.false;
	});

	it('should refuse without checking the password when the fallback does not apply', async () => {
		expect(await new PasswordCheckFallback().verify(userWithoutPassword, 'abcdef', false)).to.be.false;
		expect(checkPassword.called).to.be.false;
	});

	it('should answer to the password method, send nothing after a wrong password and leave limits to the rate limiter', async () => {
		const fallback = new PasswordCheckFallback();

		expect(fallback.name).to.equal('password');
		expect(await fallback.processInvalidCode()).to.deep.equal({ codeGenerated: false });
		expect(await fallback.maxFaildedAttemtpsReached()).to.be.false;
	});
});
