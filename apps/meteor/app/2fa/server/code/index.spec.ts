import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
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

class MeteorErrorMock extends Error {
	error: string;

	details: unknown;

	constructor(error: string, reason?: string, details?: unknown) {
		super(reason);
		this.error = error;
		this.details = details;
	}
}

const { checkCodeForUser } = proxyquire.noCallThru().load('./index', {
	'./TOTPCheck': { TOTPCheck: TOTPCheckMock },
	'./EmailCheck': { EmailCheck: DisabledCheckMock },
	'./PasswordCheckFallback': { PasswordCheckFallback: class extends DisabledCheckMock {} },
	'../../../lib/server/functions/getModifiedHttpHeaders': { normalizeHeaders: (headers: unknown) => headers },
	'../../../settings/server': { settings: { get: settingsMock } },
	'@rocket.chat/models': {
		Users: {
			findOneById: async () => null,
			setTwoFactorAuthorizationHashAndUntilForUserIdAndToken: async () => undefined,
		},
	},
	'meteor/accounts-base': { Accounts: { _getLoginToken: getLoginTokenStub } },
	'meteor/meteor': { Meteor: { Error: MeteorErrorMock } },
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
