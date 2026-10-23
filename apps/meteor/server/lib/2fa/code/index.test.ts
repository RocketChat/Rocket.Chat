import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsMock = sinon.stub();
const getLoginTokenStub = sinon.stub();

class TOTPCheckMock {
	name = 'totp';

	isEnabled() {
		return true;
	}

	async processInvalidCode() {
		return {};
	}

	async verify() {
		return false;
	}

	async maxFaildedAttemtpsReached() {
		return false;
	}
}

class DisabledCheckMock {
	name = 'email';

	isEnabled() {
		return false;
	}
}

const { checkCodeForUser } = proxyquire.noCallThru().load('./index', {
	'./TOTPCheck': { TOTPCheck: TOTPCheckMock },
	'./EmailCheck': { EmailCheck: DisabledCheckMock },
	'./PasswordCheckFallback': { PasswordCheckFallback: class extends DisabledCheckMock {} },
	'../../shared/getModifiedHttpHeaders': { normalizeHeaders: (headers: unknown) => headers },
	'../../../settings': { settings: { get: settingsMock } },
	'@rocket.chat/models': {
		Users: {
			findOneById: async () => null,
			setTwoFactorAuthorizationHashAndUntilForUserIdAndToken: async () => undefined,
		},
	},
	'meteor/accounts-base': { Accounts: { _getLoginToken: getLoginTokenStub } },
});

const HASHED_TOKEN = 'hashed-login-token';

const userWithBypassToken = {
	_id: 'user-id',
	services: { resume: { loginTokens: [{ hashedToken: HASHED_TOKEN, bypassTwoFactor: true }] } },
} as any;

const connection = {
	id: 'connection-id',
	clientAddress: '127.0.0.1',
	httpHeaders: {},
} as any;

describe('checkCodeForUser - bypassTwoFactor token resolution (SUP-1064)', () => {
	let testMode: string | undefined;

	beforeEach(() => {
		// TEST_MODE short-circuits the whole check; remove it so the token resolution path runs.
		testMode = process.env.TEST_MODE;
		delete process.env.TEST_MODE;

		settingsMock.reset();
		settingsMock.withArgs('Accounts_TwoFactorAuthentication_Enabled').returns(true);
		getLoginTokenStub.reset();
	});

	afterEach(() => {
		if (testMode !== undefined) {
			process.env.TEST_MODE = testMode;
		}
	});

	it('should honor a bypassTwoFactor token resolved from the REST connection (connection.token)', async () => {
		// REST: the token is not registered in account data, only carried on the connection.
		getLoginTokenStub.returns(undefined);

		const authorized = await checkCodeForUser({
			user: userWithBypassToken,
			connection: { ...connection, token: HASHED_TOKEN },
			options: {},
		});

		expect(authorized).to.be.equal(true);
	});

	it('should honor a bypassTwoFactor token resolved from account data (DDP, _getLoginToken)', async () => {
		// DDP: the token is registered in Accounts._accountData and read via _getLoginToken.
		getLoginTokenStub.returns(HASHED_TOKEN);

		const authorized = await checkCodeForUser({
			user: userWithBypassToken,
			connection: { ...connection, token: undefined },
			options: {},
		});

		expect(authorized).to.be.equal(true);
	});

	it('should still require a second factor when the token cannot be resolved from either source', async () => {
		// Regression guard: this is the buggy state (#38017) the fix addresses.
		getLoginTokenStub.returns(undefined);

		await expect(
			checkCodeForUser({
				user: userWithBypassToken,
				connection: { ...connection, token: undefined },
				options: {},
			}),
		).to.be.rejectedWith('TOTP Required');
	});
});

describe('checkCodeForUser - remembered two-factor authorization', () => {
	const REMEMBER_FOR_SECONDS = 1800;
	const TOKEN = 'remembered-login-token';

	const settingsGet = sinon.stub();
	const totpVerify = sinon.stub();
	const setTwoFactorAuthorization = sinon.stub();

	class EnabledTOTPCheck extends TOTPCheckMock {
		override async verify(...args: unknown[]) {
			return totpVerify(...args);
		}
	}

	const twoFactor = proxyquire.noCallThru().load('./index', {
		'./TOTPCheck': { TOTPCheck: EnabledTOTPCheck },
		'./EmailCheck': { EmailCheck: DisabledCheckMock },
		'./PasswordCheckFallback': { PasswordCheckFallback: class extends DisabledCheckMock {} },
		'../../shared/getModifiedHttpHeaders': { normalizeHeaders: (headers: unknown) => headers },
		'../../../settings': { settings: { get: settingsGet } },
		'@rocket.chat/models': {
			Users: {
				findOneById: async () => null,
				setTwoFactorAuthorizationHashAndUntilForUserIdAndToken: setTwoFactorAuthorization,
			},
		},
		'meteor/accounts-base': { Accounts: { _getLoginToken: () => TOKEN } },
	});

	const browserConnection = {
		id: 'connection-id',
		clientAddress: '10.0.0.1',
		httpHeaders: { 'user-agent': 'Mozilla/5.0 Rocket.Chat test browser' },
	} as any;

	// Registered long before the post-registration grace window; TOTP is enabled through the mocked check.
	const buildUser = (loginToken: Record<string, unknown> = {}) =>
		({
			_id: 'user-id',
			createdAt: new Date('2020-01-01T00:00:00.000Z'),
			services: { resume: { loginTokens: [{ hashedToken: TOKEN, ...loginToken }] } },
		}) as any;

	const inOneMinute = () => new Date(Date.now() + 60 * 1000);

	const rememberedFor = (connection: typeof browserConnection, twoFactorAuthorizedUntil = inOneMinute()) => ({
		twoFactorAuthorizedUntil,
		twoFactorAuthorizedHash: twoFactor.getFingerprintFromConnection(connection),
	});

	let testMode: string | undefined;

	beforeEach(() => {
		testMode = process.env.TEST_MODE;
		delete process.env.TEST_MODE;

		settingsGet.reset();
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_Enabled').returns(true);
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_RememberFor').returns(REMEMBER_FOR_SECONDS);
		totpVerify.reset();
		totpVerify.resolves(false);
		setTwoFactorAuthorization.reset();
		setTwoFactorAuthorization.resolves();
	});

	afterEach(() => {
		if (testMode !== undefined) {
			process.env.TEST_MODE = testMode;
		}
	});

	describe('when a second factor is required', () => {
		it('should demand a code even with a bypassTwoFactor token', async () => {
			await expect(
				twoFactor.checkCodeForUser({
					user: buildUser({ bypassTwoFactor: true }),
					connection: browserConnection,
					options: { requireSecondFactor: true },
				}),
			).to.be.rejectedWith('TOTP Required');
		});

		it('should demand a code even with a valid remembered authorization', async () => {
			await expect(
				twoFactor.checkCodeForUser({
					user: buildUser(rememberedFor(browserConnection)),
					connection: browserConnection,
					options: { requireSecondFactor: true },
				}),
			).to.be.rejectedWith('TOTP Required');
		});
	});

	describe('for an established user with a second-factor method', () => {
		it('should accept a remembered authorization that is unexpired and from the same connection', async () => {
			const authorized = await twoFactor.checkCodeForUser({
				user: buildUser(rememberedFor(browserConnection)),
				connection: browserConnection,
			});

			expect(authorized).to.be.equal(true);
			expect(totpVerify.called).to.be.equal(false);
		});

		it('should demand a code when the remembered authorization has expired', async () => {
			await expect(
				twoFactor.checkCodeForUser({
					user: buildUser(rememberedFor(browserConnection, new Date(Date.now() - 1000))),
					connection: browserConnection,
				}),
			).to.be.rejectedWith('TOTP Required');
		});

		it('should demand a code when the remembered authorization has no expiration', async () => {
			const { twoFactorAuthorizedHash } = rememberedFor(browserConnection);

			await expect(
				twoFactor.checkCodeForUser({ user: buildUser({ twoFactorAuthorizedHash }), connection: browserConnection }),
			).to.be.rejectedWith('TOTP Required');
		});

		it('should demand a code when the remembered authorization has no fingerprint', async () => {
			await expect(
				twoFactor.checkCodeForUser({
					user: buildUser({ twoFactorAuthorizedUntil: inOneMinute() }),
					connection: browserConnection,
				}),
			).to.be.rejectedWith('TOTP Required');
		});

		it('should demand a code when the user agent changed since the authorization was remembered', async () => {
			const otherBrowser = { ...browserConnection, httpHeaders: { 'user-agent': 'curl/8.0' } };

			await expect(
				twoFactor.checkCodeForUser({ user: buildUser(rememberedFor(browserConnection)), connection: otherBrowser }),
			).to.be.rejectedWith('TOTP Required');
		});

		it('should demand a code when the client address changed since the authorization was remembered', async () => {
			const otherAddress = { ...browserConnection, clientAddress: '192.168.1.20' };

			await expect(
				twoFactor.checkCodeForUser({ user: buildUser(rememberedFor(browserConnection)), connection: otherAddress }),
			).to.be.rejectedWith('TOTP Required');
		});
	});

	describe('after a valid code', () => {
		it('should remember the authorization for this connection until the configured period ends', async () => {
			const now = new Date('2026-10-22T12:00:00.000Z');
			const clock = sinon.useFakeTimers({ now, toFake: ['Date'] });
			totpVerify.resolves(true);

			try {
				const authorized = await twoFactor.checkCodeForUser({ user: buildUser(), code: '123456', connection: browserConnection });

				expect(authorized).to.be.equal(true);
				expect(setTwoFactorAuthorization.calledOnce).to.be.equal(true);
				const [userId, token, fingerprint, expires] = setTwoFactorAuthorization.firstCall.args;
				expect(userId).to.be.equal('user-id');
				expect(token).to.be.equal(TOKEN);
				expect(fingerprint).to.be.equal(twoFactor.getFingerprintFromConnection(browserConnection));
				expect(expires.getTime()).to.be.equal(now.getTime() + REMEMBER_FOR_SECONDS * 1000);

				// The stored authorization lets the same connection through without a code.
				const rememberedUser = buildUser({ twoFactorAuthorizedHash: fingerprint, twoFactorAuthorizedUntil: expires });
				expect(await twoFactor.checkCodeForUser({ user: rememberedUser, connection: browserConnection })).to.be.equal(true);
			} finally {
				clock.restore();
			}
		});

		it('should not remember the authorization when remembering is turned off', async () => {
			settingsGet.withArgs('Accounts_TwoFactorAuthentication_RememberFor').returns(0);
			totpVerify.resolves(true);

			const authorized = await twoFactor.checkCodeForUser({ user: buildUser(), code: '123456', connection: browserConnection });

			expect(authorized).to.be.equal(true);
			expect(setTwoFactorAuthorization.called).to.be.equal(false);
		});
	});
});
