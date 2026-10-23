import { after, before, beforeEach, describe, it } from 'node:test';

import type { ClientSafeError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const totpEnabled = sinon.stub().returns(false);
const emailEnabled = sinon.stub().returns(false);
const createTwoFactorChallenge = sinon.stub();

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
		return emailEnabled();
	}

	async processInvalidCode(): Promise<{ codeGenerated: boolean }> {
		return { codeGenerated: false };
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
		TwoFactorChallenges: { createTwoFactorChallenge },
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
	'./TOTPCheck': { TOTPCheck },
	'./EmailCheck': { EmailCheck },
	'./PasswordCheckFallback': { PasswordCheckFallback },
	'../../shared/getModifiedHttpHeaders': {
		normalizeHeaders: (headers: unknown) => headers,
	},
	'../../../settings': {
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

describe('checkCodeForUser - resend challenge for emailed codes', () => {
	let originalTestMode: string | undefined;
	const user = buildUser(new Date(0));

	before(() => {
		originalTestMode = process.env.TEST_MODE;
		delete process.env.TEST_MODE;

		settingsGet.callsFake((key: string) => key === 'Accounts_TwoFactorAuthentication_Enabled');
		emailEnabled.returns(true);
	});

	after(() => {
		emailEnabled.returns(false);
		if (originalTestMode === undefined) {
			delete process.env.TEST_MODE;
		} else {
			process.env.TEST_MODE = originalTestMode;
		}
	});

	beforeEach(() => {
		totpEnabled.returns(false);
		createTwoFactorChallenge.reset();
		createTwoFactorChallenge.resolves('challenge-id');
	});

	it('should give a password login a resend-only challenge', async () => {
		const error = await checkCodeForUser({ user, options: { issueResendChallenge: true } }).catch((e: ClientSafeError) => e);

		expect(error).to.have.nested.property('details.challengeId', 'challenge-id');
		expect(createTwoFactorChallenge.calledOnceWithExactly('user-id', 'email', 'resend')).to.be.equal(true);
	});

	it('should not issue a challenge when the login asks for a TOTP code', async () => {
		totpEnabled.returns(true);

		const error = await checkCodeForUser({ user, options: { issueResendChallenge: true } }).catch((e: ClientSafeError) => e);

		expect(error).to.have.nested.property('details.method', 'totp');
		expect(error).to.not.have.nested.property('details.challengeId');
		expect(createTwoFactorChallenge.called).to.be.equal(false);
	});

	it('should not issue a challenge when the caller is not a login', async () => {
		const error = await checkCodeForUser({ user, options: {} }).catch((e: ClientSafeError) => e);

		expect(error).to.have.property('error', 'totp-required');
		expect(error).to.not.have.nested.property('details.challengeId');
		expect(createTwoFactorChallenge.called).to.be.equal(false);
	});
});
