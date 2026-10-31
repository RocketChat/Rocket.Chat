import { after, before, beforeEach, describe, it } from 'node:test';

import type { ClientSafeError } from '@rocket.chat/core-services';
import type { IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const findOneById = sinon.stub();
const rememberAuthorization = sinon.stub();
const findUserByToken = sinon.stub();
const getLoginToken = sinon.stub();

const totp = { isEnabled: sinon.stub(), verify: sinon.stub(), maxFaildedAttemtpsReached: sinon.stub() };
const email = { isEnabled: sinon.stub(), verify: sinon.stub(), maxFaildedAttemtpsReached: sinon.stub() };
const password = { isEnabled: sinon.stub(), verify: sinon.stub(), maxFaildedAttemtpsReached: sinon.stub() };

const buildCheck = (name: string, doubles: typeof totp) =>
	class {
		name = name;

		isEnabled = doubles.isEnabled;

		verify = doubles.verify;

		maxFaildedAttemtpsReached = doubles.maxFaildedAttemtpsReached;

		async processInvalidCode(): Promise<{ codeGenerated: boolean }> {
			return { codeGenerated: false };
		}
	};

const { checkCodeForUser, getFingerprintFromConnection, rememberAuthorizationByToken } = proxyquire.noCallThru().load('./index', {
	'meteor/accounts-base': { Accounts: { _getLoginToken: getLoginToken } },
	'./TOTPCheck': { TOTPCheck: buildCheck('totp', totp) },
	'./EmailCheck': { EmailCheck: buildCheck('email', email) },
	'./PasswordCheckFallback': { PasswordCheckFallback: buildCheck('password', password) },
	'../../../settings': { settings: { get: settingsGet } },
});

const user = {
	_id: 'user-id',
	createdAt: new Date('2020-01-01T00:00:00.000Z'),
	services: { resume: { loginTokens: [{ hashedToken: 'token-hash' }] } },
};

const connectionWith = (httpHeaders: Record<string, string> = {}) => ({ id: 'connection-id', clientAddress: '127.0.0.1', httpHeaders });

describe('checkCodeForUser - code verification', () => {
	let originalTestMode: string | undefined;

	before(() => {
		registerModel('IUsersModel', {
			findOneById,
			findOneByIdAndLoginHashedToken: findUserByToken,
			setTwoFactorAuthorizationHashAndUntilForUserIdAndToken: rememberAuthorization,
		} as unknown as IUsersModel);
		originalTestMode = process.env.TEST_MODE;
		delete process.env.TEST_MODE;
	});

	after(() => {
		if (originalTestMode !== undefined) {
			process.env.TEST_MODE = originalTestMode;
		}
	});

	beforeEach(() => {
		settingsGet.reset();
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_Enabled').returns(true);
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_RememberFor').returns(1800);
		findOneById.reset();
		rememberAuthorization.reset();
		findUserByToken.reset();
		getLoginToken.reset();
		getLoginToken.returns('token-hash');

		for (const check of [totp, email, password]) {
			check.isEnabled.reset();
			check.isEnabled.returns(false);
			check.verify.reset();
			check.verify.resolves(false);
			check.maxFaildedAttemtpsReached.reset();
			check.maxFaildedAttemtpsReached.resolves(false);
		}
		totp.isEnabled.returns(true);
	});

	describe('with a code', () => {
		it('should refuse a wrong code and remember nothing for this connection', async () => {
			const error = await checkCodeForUser({ user, code: 'wrong', connection: connectionWith() }).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'totp-invalid');
			expect(rememberAuthorization.called).to.be.false;
		});

		it('should tell the user when too many wrong codes were sent', async () => {
			totp.maxFaildedAttemtpsReached.resolves(true);

			const error = await checkCodeForUser({ user, code: 'wrong' }).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'totp-max-attempts');
		});

		it('should list the methods the user can switch to when a code is refused', async () => {
			email.isEnabled.returns(true);

			const error = await checkCodeForUser({ user, code: 'wrong' }).catch((e: ClientSafeError) => e);

			expect(error).to.have.nested.property('details.method', 'totp');
			expect(error).to.have.nested.property('details.availableMethods').that.has.members(['totp', 'email']);
		});
	});

	describe('with the code in the request headers', () => {
		it('should accept a valid code sent in the headers', async () => {
			email.verify.resolves(true);
			const connection = connectionWith({ 'x-2fa-code': '123456', 'x-2fa-method': 'email' });

			expect(await checkCodeForUser({ user, connection })).to.be.true;
			expect(email.verify.calledOnce).to.be.true;
			expect(email.verify.firstCall.args[1]).to.equal('123456');
		});

		it('should demand a code when the headers do not name the method', async () => {
			totp.verify.resolves(true);
			const connection = connectionWith({ 'x-2fa-code': '123456' });

			const error = await checkCodeForUser({ user, connection }).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'totp-required');
			expect(totp.verify.called).to.be.false;
		});

		it('should prefer a code from the caller that names no method over the headers', async () => {
			totp.verify.withArgs(user, 'from-caller').resolves(true);
			const connection = connectionWith({ 'x-2fa-code': 'from-header', 'x-2fa-method': 'email' });

			expect(await checkCodeForUser({ user, code: 'from-caller', connection })).to.be.true;
			expect(email.verify.called).to.be.false;
		});

		it('should check the code given by the caller instead of the one in the headers', async () => {
			totp.verify.withArgs(user, 'from-caller').resolves(true);
			const connection = connectionWith({ 'x-2fa-code': 'from-header', 'x-2fa-method': 'email' });

			expect(await checkCodeForUser({ user, code: 'from-caller', method: 'totp', connection })).to.be.true;
			expect(email.verify.called).to.be.false;
		});
	});

	describe('choosing the method', () => {
		it('should check the method the caller asks for', async () => {
			email.isEnabled.returns(true);
			email.verify.resolves(true);

			expect(await checkCodeForUser({ user, code: '123456', method: 'email' })).to.be.true;
			expect(totp.verify.called).to.be.false;
		});

		it('should not skip the check when the caller asks for a method that does not exist', async () => {
			const error = await checkCodeForUser({ user, code: '123456', method: 'none' }).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'totp-invalid');
			expect(error).to.have.nested.property('details.method', 'totp');
		});

		it('should demand the password when a second factor is required and the user has no method', async () => {
			totp.isEnabled.returns(false);

			const error = await checkCodeForUser({ user, options: { requireSecondFactor: true } }).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'totp-required');
			expect(error).to.have.nested.property('details.method', 'password');
		});

		it('should demand the password even if the fallback is turned off when a second factor is required', async () => {
			totp.isEnabled.returns(false);
			const options = { requireSecondFactor: true, disablePasswordFallback: true };

			const error = await checkCodeForUser({ user, options }).catch((e: ClientSafeError) => e);

			expect(error).to.have.nested.property('details.method', 'password');
		});

		it('should demand the password when the fallback applies to a user with no method', async () => {
			totp.isEnabled.returns(false);
			password.isEnabled.returns(true);

			const error = await checkCodeForUser({ user }).catch((e: ClientSafeError) => e);

			expect(error).to.have.nested.property('details.method', 'password');
		});

		it('should not demand the password when the caller turns the fallback off', async () => {
			totp.isEnabled.returns(false);
			password.isEnabled.returns(true);

			expect(await checkCodeForUser({ user, options: { disablePasswordFallback: true } })).to.be.true;
		});

		it('should let the action through when the user has no method and no fallback applies', async () => {
			totp.isEnabled.returns(false);
			password.isEnabled.callsFake((_user, secondFactorRequired) => secondFactorRequired);

			expect(await checkCodeForUser({ user })).to.be.true;
		});
	});

	describe('remembering a valid code', () => {
		const connection = connectionWith();

		beforeEach(() => {
			totp.verify.resolves(true);
		});

		it('should remember the code for this login token and this device', async () => {
			await checkCodeForUser({ user, code: '123456', connection });

			expect(rememberAuthorization.calledOnceWith('user-id', 'token-hash', getFingerprintFromConnection(connection), sinon.match.date)).to
				.be.true;
		});

		it('should not remember the code when the caller turns that off', async () => {
			await checkCodeForUser({ user, code: '123456', connection, options: { disableRememberMe: true } });

			expect(rememberAuthorization.called).to.be.false;
		});

		it('should not remember the code when the server is set to always ask', async () => {
			settingsGet.withArgs('Accounts_TwoFactorAuthentication_RememberFor').returns(0);

			await checkCodeForUser({ user, code: '123456', connection });

			expect(rememberAuthorization.called).to.be.false;
		});

		it('should not remember the code for a connection with no login token', async () => {
			getLoginToken.returns(undefined);

			await checkCodeForUser({ user, code: '123456', connection });

			expect(rememberAuthorization.called).to.be.false;
		});
	});

	describe('remembering a login token', () => {
		const connection = connectionWith();

		it('should remember the token of an existing session for this device', async () => {
			findUserByToken.withArgs('user-id', 'token-hash').resolves({ _id: 'user-id' });

			await rememberAuthorizationByToken('token-hash', 'user-id', connection);

			expect(rememberAuthorization.calledOnceWith('user-id', 'token-hash', getFingerprintFromConnection(connection), sinon.match.date)).to
				.be.true;
		});

		it('should refuse a token that does not belong to the user', async () => {
			findUserByToken.resolves(null);

			const error = await rememberAuthorizationByToken('other-token', 'user-id', connection).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'error-user-not-found');
			expect(rememberAuthorization.called).to.be.false;
		});

		it('should remember nothing when the server is set to always ask', async () => {
			settingsGet.withArgs('Accounts_TwoFactorAuthentication_RememberFor').returns(0);
			findUserByToken.resolves({ _id: 'user-id' });

			await rememberAuthorizationByToken('token-hash', 'user-id', connection);

			expect(rememberAuthorization.called).to.be.false;
		});
	});

	describe('users who just registered', () => {
		const justRegistered = { ...user, createdAt: new Date() };

		it('should not ask for the password until the user has had time to set up a method', async () => {
			totp.isEnabled.returns(false);
			password.isEnabled.returns(true);

			expect(await checkCodeForUser({ user: justRegistered, connection: connectionWith() })).to.be.true;
		});

		it('should ask for a code as soon as the user has a method', async () => {
			const error = await checkCodeForUser({ user: justRegistered, connection: connectionWith() }).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'totp-required');
		});

		it('should ask for the password once that time is over', async () => {
			totp.isEnabled.returns(false);
			password.isEnabled.returns(true);

			const error = await checkCodeForUser({ user, connection: connectionWith() }).catch((e: ClientSafeError) => e);

			expect(error).to.have.nested.property('details.method', 'password');
		});
	});

	describe('login tokens that skip two-factor authentication', () => {
		it('should still demand a code when the token has the bypass turned off', async () => {
			const tokenWithoutBypass = {
				...user,
				services: { resume: { loginTokens: [{ hashedToken: 'token-hash', bypassTwoFactor: false }] } },
			};

			const error = await checkCodeForUser({ user: tokenWithoutBypass, connection: connectionWith() }).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'totp-required');
		});
	});

	describe('before any check', () => {
		it('should not ask for a code when two-factor authentication is off for the server', async () => {
			settingsGet.withArgs('Accounts_TwoFactorAuthentication_Enabled').returns(false);

			expect(await checkCodeForUser({ user })).to.be.true;
		});

		it('should load the user when it receives only an id', async () => {
			findOneById.resolves(user);
			totp.verify.resolves(true);

			expect(await checkCodeForUser({ user: 'user-id', code: '123456' })).to.be.true;
			expect(findOneById.calledOnceWith('user-id')).to.be.true;
		});

		it('should refuse an id with no user', async () => {
			findOneById.resolves(null);

			const error = await checkCodeForUser({ user: 'unknown-id', code: '123456' }).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'totp-user-not-found');
		});
	});
});
