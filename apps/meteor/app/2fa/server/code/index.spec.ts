import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

const { settingsMock, getLoginTokenStub } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return { settingsMock: sinon.stub(), getLoginTokenStub: sinon.stub() };
});

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

class MeteorErrorMock extends Error {
	error: string;

	details: unknown;

	constructor(error: string, reason?: string, details?: unknown) {
		super(reason);
		this.error = error;
		this.details = details;
	}
}

vi.mock('./TOTPCheck', () => ({ TOTPCheck: TOTPCheckMock }));
vi.mock('./EmailCheck', () => ({ EmailCheck: DisabledCheckMock }));
vi.mock('./PasswordCheckFallback', () => ({ PasswordCheckFallback: class extends DisabledCheckMock {} }));
vi.mock('../../../lib/server/functions/getModifiedHttpHeaders', () => ({ normalizeHeaders: (headers: unknown) => headers }));
vi.mock('../../../settings/server', () => ({ settings: { get: settingsMock } }));
vi.mock('@rocket.chat/models', () => ({
	Users: {
		findOneById: async () => null,
		setTwoFactorAuthorizationHashAndUntilForUserIdAndToken: async () => undefined,
	},
}));
vi.mock('meteor/accounts-base', () => ({ Accounts: { _getLoginToken: getLoginTokenStub } }));
vi.mock('meteor/meteor', () => ({ Meteor: { Error: MeteorErrorMock } }));

const { checkCodeForUser } = await import('./index');

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
