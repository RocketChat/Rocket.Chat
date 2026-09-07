import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const retrieveCredential = sinon.stub().resolves(null);
const removeById = sinon.stub().resolves();
const removeNotExpiredById = sinon.stub();
const insertOrUpdateSAMLUser = sinon.stub();
const validateLoginAttempt = sinon.stub();
const checkCodeForUser = sinon.stub();
const isValidLoginAttemptByIp = sinon.stub();
const runCallback = sinon.stub();
const loginHandlers = new Map<string, (...args: any[]) => any>();
const accountsMock = {
	LoginCancelledError: { numericError: 403 },
	registerLoginHandler: (name: string, fn: (...args: any[]) => any) => loginHandlers.set(name, fn),
	_runLoginHandlers: (_context: unknown, request: any) => loginHandlers.get(request.totp?.code ? 'totp' : 'saml')?.(request),
	config: sinon.stub(),
	_defaultPublishFields: { projection: {} },
	emailTemplates: { verifyEmail: {}, resetPassword: {}, enrollAccount: {} },
	urls: {},
	onCreateUser: sinon.stub(),
	validateNewUser: sinon.stub(),
	onLogin: sinon.stub(),
	validateLoginAttempt: (fn: (...args: any[]) => any) => validateLoginAttempt.callsFake(fn),
};
class MeteorError extends Error {
	constructor(
		public error: string | number,
		public reason?: string,
	) {
		super(reason || String(error));
	}
}
const meteorMock = { Error: MeteorError, startup: sinon.stub() };
const credentialTokensMock = { removeById, removeNotExpiredById };
const samlUtilsMock = {
	serviceProviders: [{ provider: 'test-saml' }] as any[],
	log: sinon.stub(),
	mapProfileToUserObject: sinon.stub(),
	events: { emit: sinon.stub() },
};

proxyquire.noCallThru().load('../../../../../server/lib/saml/loginHandler', {
	'@rocket.chat/models': {
		CredentialTokens: credentialTokensMock,
	},
	'meteor/accounts-base': {
		Accounts: accountsMock,
	},
	'meteor/meteor': {
		Meteor: meteorMock,
	},
	'./lib/SAML': {
		SAML: { retrieveCredential, insertOrUpdateSAMLUser },
	},
	'./lib/Utils': {
		SAMLUtils: samlUtilsMock,
	},
	'../i18n': { i18n: { t: sinon.stub().returns('') } },
	'../logger/system': { SystemLogger: { error: sinon.stub() } },
	'../premiumAuthDeprecation': { warnUnlicensedAuthService: sinon.stub() },
});

proxyquire.noCallThru().load('../../../../../server/lib/2fa/loginHandler', {
	'meteor/accounts-base': { Accounts: accountsMock },
	'meteor/check': { check: sinon.stub() },
	'meteor/meteor': { Meteor: meteorMock },
	'meteor/oauth': { OAuth: {} },
	'./code': { checkCodeForUser },
	'../callbacks': {
		callbacks: {
			priority: { MEDIUM: 0 },
			add: (_name: string, fn: (...args: any[]) => any) => runCallback.callsFake(fn),
		},
	},
});

proxyquire.noCallThru().load('../../../../../server/lib/auth/startup', {
	'@rocket.chat/apps': { Apps: {}, AppEvents: {} },
	'@rocket.chat/core-services': {},
	'@rocket.chat/models': { CredentialTokens: credentialTokensMock, Users: { updateLastLoginById: sinon.stub().resolves() } },
	'@rocket.chat/tools': {},
	'meteor/accounts-base': { Accounts: accountsMock },
	'meteor/check': {},
	'meteor/meteor': { Meteor: meteorMock },
	'underscore': {},
	'./restrictLoginAttempts': { isValidAttemptByUser: sinon.stub().resolves(true), isValidLoginAttemptByIp },
	'../../../lib/utils/parseCSV': {},
	'../../../lib/utils/safeHtmlDots': {},
	'../../services/user/lib/getNewUserRoles': {},
	'../../settings': {},
	'../callbacks': {
		callbacks: { run: (name: string, login: unknown) => (name === 'onValidateLogin' ? runCallback(login) : login) },
	},
	'../callbacks/beforeCreateUserCallback': {},
	'../getClientAddress': { getClientAddress: sinon.stub().returns('127.0.0.1') },
	'../getMaxLoginTokens': {},
	'../i18n': {},
	'../notifications/email/api': {},
	'../notifyListener': {},
	'../roles/addUserRoles': {},
	'../rooms/joinDefaultChannels': {},
	'../users/getAvatarSuggestionForUser': {},
	'../users/setUserAvatar': {},
	'../utils/functions/getBaseUserFields': { getBaseUserFields: () => ({}) },
});

const handler = (request: unknown) => loginHandlers.get('saml')?.(request);

describe('SAML loginHandler', () => {
	let clock: sinon.SinonFakeTimers;
	let credential: { expireAt: Date; userInfo: { profile?: object } } | undefined;
	const request = { saml: true, credentialToken: 'saml-token' };
	const retry = (code: string) => ({ totp: { code, login: request } });
	const user = { _id: 'user-id', active: true, roles: ['user'], type: 'user' };

	// Meteor awaits the registered login handler, then the login validators, before issuing a login token.
	const attemptLogin = async (args: any, loginUser = user) => {
		const result = await accountsMock._runLoginHandlers({}, args);
		const allowed = await validateLoginAttempt({
			type: 'saml',
			allowed: !!result.userId && !result.error,
			error: result.error,
			user: result.userId ? loginUser : undefined,
			methodName: 'login',
			methodArguments: [args],
			connection: {},
		});
		if (!allowed) {
			throw result.error;
		}
		return result;
	};

	beforeEach(() => {
		clock = sinon.useFakeTimers({ toFake: ['Date'] });
		credential = { expireAt: new Date(Date.now() + 60000), userInfo: { profile: {} } };
		retrieveCredential.reset();
		retrieveCredential.callsFake(async () => (credential && credential.expireAt > new Date() ? credential.userInfo : undefined));
		removeById.reset();
		removeById.callsFake(async () => {
			credential = undefined;
		});
		removeNotExpiredById.reset();
		removeNotExpiredById.callsFake(async () => {
			const result = credential && credential.expireAt > new Date() ? credential : null;
			if (result) {
				credential = undefined;
			}
			return result;
		});
		insertOrUpdateSAMLUser.reset();
		insertOrUpdateSAMLUser.resolves({ userId: user._id });
		checkCodeForUser.reset();
		checkCodeForUser.resolves(true);
		isValidLoginAttemptByIp.reset();
		isValidLoginAttemptByIp.resolves(true);
		samlUtilsMock.mapProfileToUserObject.reset();
		samlUtilsMock.mapProfileToUserObject.returns({});
		samlUtilsMock.serviceProviders = [{ provider: 'test-saml' }];
	});

	afterEach(() => clock.restore());

	it('should reject non-string credentialToken and never query the database (NoSQL injection prevention)', async () => {
		expect(await handler({ saml: true, credentialToken: { $gt: '' } })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: { $ne: null } })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: { $not: { $eq: '__nonexistent__' } } })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: 123 })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: ['a'] })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: null })).to.be.undefined;

		expect(retrieveCredential.called).to.be.false;
	});

	it('should return undefined when no SAML providers are configured', async () => {
		samlUtilsMock.serviceProviders = [];

		expect(await handler({ saml: true, credentialToken: 'valid-token' })).to.be.undefined;
		expect(retrieveCredential.called).to.be.false;
	});

	it('should preserve the credential through an initial challenge and wrong-code retry, then consume it on success', async () => {
		const expireAt = credential?.expireAt;
		checkCodeForUser.onFirstCall().rejects(new MeteorError('totp-required'));
		checkCodeForUser.onSecondCall().rejects(new MeteorError('totp-invalid'));

		await expect(attemptLogin(request)).to.be.rejectedWith('totp-required');
		clock.tick(20000);
		await expect(attemptLogin(retry('wrong-code'))).to.be.rejectedWith('totp-invalid');
		expect(credential?.expireAt).to.equal(expireAt);
		expect(removeById.called).to.be.false;
		expect(removeNotExpiredById.called).to.be.false;

		await expect(attemptLogin(retry('correct-code'))).to.eventually.deep.equal({ userId: user._id });
		expect(checkCodeForUser.lastCall.args[0].code).to.equal('correct-code');
		expect(removeNotExpiredById.calledOnceWithExactly(request.credentialToken)).to.be.true;
		expect(credential).to.be.undefined;
		await expect(attemptLogin(retry('correct-code'))).to.be.rejectedWith('No matching login attempt found');
	});

	it('should consume a non-2FA login before returning success', async () => {
		await attemptLogin(request);
		expect(removeNotExpiredById.calledOnceWithExactly(request.credentialToken)).to.be.true;
		expect(credential).to.be.undefined;
		await expect(attemptLogin(request)).to.be.rejectedWith('No matching login attempt found');
	});

	it('should allow only one concurrent successful login with the same credential', async () => {
		const results = await Promise.allSettled([attemptLogin(request), attemptLogin(request)]);
		expect(results.filter(({ status }) => status === 'fulfilled')).to.have.lengthOf(1);
		expect(results.filter(({ status }) => status === 'rejected')).to.have.lengthOf(1);
	});

	it('should reject expired credentials even before the TTL cleanup runs', async () => {
		checkCodeForUser.rejects(new MeteorError('totp-required'));
		await expect(attemptLogin(request)).to.be.rejectedWith('totp-required');
		clock.tick(60000);
		await expect(attemptLogin(retry('correct-code'))).to.be.rejectedWith('No matching login attempt found');
		expect(insertOrUpdateSAMLUser.calledOnce).to.be.true;
		expect(credential).to.be.undefined;
	});

	it('should reject a credential that expires during validation', async () => {
		checkCodeForUser.callsFake(async () => clock.tick(60000));
		await expect(attemptLogin(request)).to.be.rejectedWith('No matching login attempt found');
		expect(credential).to.be.undefined;
	});

	for (const error of ['totp-max-attempts', 'error-login-blocked-for-user', 'unexpected-validation-error']) {
		it(`should remove credentials on terminal validation failure: ${error}`, async () => {
			checkCodeForUser.rejects(new MeteorError(error));
			await expect(attemptLogin(retry('code'))).to.be.rejectedWith(error);
			expect(credential).to.be.undefined;
		});
	}

	it('should remove credentials on failures before the 2FA validator', async () => {
		isValidLoginAttemptByIp.resolves(false);
		await expect(attemptLogin(request)).to.be.rejectedWith('Login has been temporarily blocked For IP');
		expect(checkCodeForUser.called).to.be.false;
		expect(credential).to.be.undefined;
	});

	it('should consume credentials even when validation skips the 2FA callback', async () => {
		await attemptLogin(request, { ...user, type: 'visitor' });
		expect(checkCodeForUser.called).to.be.false;
		expect(credential).to.be.undefined;
	});

	it('should consume the innermost credential for nested TOTP login requests', async () => {
		await attemptLogin({ totp: { code: 'outer-code', login: retry('inner-code') } });
		expect(removeNotExpiredById.calledOnceWithExactly(request.credentialToken)).to.be.true;
		expect(credential).to.be.undefined;
	});

	it('should not change credentials when validating another login service', async () => {
		await validateLoginAttempt({
			type: 'oauth',
			allowed: true,
			user,
			methodName: 'login',
			methodArguments: [request],
			connection: {},
		});
		expect(removeById.called).to.be.false;
		expect(removeNotExpiredById.called).to.be.false;
	});

	it('should remove credentials without profile information', async () => {
		credential!.userInfo = {};
		const result = await handler(request);
		expect(result.error.reason).to.equal('No profile information found');
		expect(credential).to.be.undefined;
	});

	it('should remove credentials if updating the SAML user fails', async () => {
		insertOrUpdateSAMLUser.rejects(new Error('Unable to update user'));
		const result = await handler(request);
		expect(result.error.reason).to.equal('Error: Unable to update user');
		expect(credential).to.be.undefined;
	});
});
