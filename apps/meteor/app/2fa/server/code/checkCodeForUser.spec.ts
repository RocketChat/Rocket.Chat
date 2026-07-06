import { expect } from 'chai';
import { before, after, beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const totpEnabled = sinon.stub().returns(false);

class MeteorError extends Error {
	error: string;

	details?: unknown;

	constructor(error: string, reason?: string, details?: unknown) {
		super(reason ?? error);
		this.error = error;
		this.details = details;
	}
}

// Disabled second-factor methods so the password fallback is the only candidate.
class TOTPCheck {
	name = 'totp';

	isEnabled(): boolean {
		return totpEnabled();
	}

	async processInvalidCode(): Promise<{ codeGenerated: boolean }> {
		return { codeGenerated: false };
	}
}

class EmailCheck {
	name = 'email';

	isEnabled(): boolean {
		return false;
	}
}

class PasswordCheckFallback {
	name = 'password';

	isEnabled(): boolean {
		return true;
	}

	async verify(): Promise<boolean> {
		return false;
	}

	async processInvalidCode(): Promise<{ codeGenerated: boolean }> {
		return { codeGenerated: false };
	}

	async maxFaildedAttemtpsReached(): Promise<boolean> {
		return false;
	}
}

const { checkCodeForUser, getFingerprintFromConnection } = proxyquire.noCallThru().load('./index', {
	'@rocket.chat/models': {
		Users: {
			findOneById: async () => null,
			setTwoFactorAuthorizationHashAndUntilForUserIdAndToken: async () => undefined,
		},
	},
	'meteor/accounts-base': {
		Accounts: {
			_getLoginToken: () => 'token-hash',
		},
	},
	'meteor/meteor': {
		Meteor: { Error: MeteorError },
	},
	'./TOTPCheck': { TOTPCheck },
	'./EmailCheck': { EmailCheck },
	'./PasswordCheckFallback': { PasswordCheckFallback },
	'../../../lib/server/functions/getModifiedHttpHeaders': {
		normalizeHeaders: (headers: unknown) => headers,
	},
	'../../../settings/server': {
		settings: { get: settingsGet },
	},
});

const REMEMBER_FOR_SECONDS = 1800;

const buildUser = (createdAt: Date) => ({
	_id: 'user-id',
	createdAt,
	services: {
		password: { bcrypt: 'hashed' },
		resume: { loginTokens: [{ hashedToken: 'token-hash' }] },
	},
});

const connection = {
	id: 'connection-id',
	httpHeaders: { 'user-agent': 'agent' },
	clientAddress: '127.0.0.1',
};

describe('checkCodeForUser - post-registration grace window', () => {
	let originalTestMode: string | undefined;

	before(() => {
		originalTestMode = process.env.TEST_MODE;
		delete process.env.TEST_MODE;

		settingsGet.callsFake((key: string) => {
			switch (key) {
				case 'Accounts_TwoFactorAuthentication_Enabled':
					return true;
				case 'Accounts_TwoFactorAuthentication_RememberFor':
					return REMEMBER_FOR_SECONDS;
				case 'Accounts_TwoFactorAuthentication_Enforce_Password_Fallback':
					return true;
				default:
					return false;
			}
		});
	});

	after(() => {
		if (originalTestMode === undefined) {
			delete process.env.TEST_MODE;
		} else {
			process.env.TEST_MODE = originalTestMode;
		}
	});

	beforeEach(() => {
		totpEnabled.reset();
		totpEnabled.returns(false);
	});

	it('should not prompt a freshly registered user even when disableRememberMe is set (Setup Wizard regression)', async () => {
		const user = buildUser(new Date());

		const result = await checkCodeForUser({
			user,
			options: { disableRememberMe: true },
			connection,
		});

		expect(result).to.be.equal(true);
	});

	it('should still prompt a freshly registered user who already has a 2FA method configured', async () => {
		totpEnabled.returns(true);
		const user = buildUser(new Date());

		await expect(
			checkCodeForUser({
				user,
				options: { disableRememberMe: true },
				connection,
			}),
		).to.be.rejectedWith('TOTP Required');
	});

	it('should still prompt when the post-registration grace window has expired and disableRememberMe is set', async () => {
		const user = buildUser(new Date(Date.now() - (REMEMBER_FOR_SECONDS + 60) * 1000));

		await expect(
			checkCodeForUser({
				user,
				options: { disableRememberMe: true },
				connection,
			}),
		).to.be.rejectedWith('TOTP Required');
	});

	it('should ignore a remembered authorization when disableRememberMe is set and grace window expired', async () => {
		const user = buildUser(new Date(Date.now() - (REMEMBER_FOR_SECONDS + 60) * 1000));
		// A previously remembered 2FA authorization that is still valid in time.
		user.services.resume.loginTokens[0] = {
			hashedToken: 'token-hash',
			twoFactorAuthorizedUntil: new Date(Date.now() + 60 * 1000),
			twoFactorAuthorizedHash: getFingerprintFromConnection(connection),
		} as (typeof user.services.resume.loginTokens)[number];

		await expect(
			checkCodeForUser({
				user,
				options: { disableRememberMe: true },
				connection,
			}),
		).to.be.rejectedWith('TOTP Required');
	});
});
