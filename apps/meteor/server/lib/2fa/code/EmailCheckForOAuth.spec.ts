import type { SettingValue } from '@rocket.chat/core-typings';
import { mockModel } from '@rocket.chat/models/testing';
import bcrypt from 'bcrypt';

import { EmailCheckForOAuth } from './EmailCheckForOAuth';
import type { TwoFactorUser } from './ICodeCheck';
import { createFakeUser } from '../../../../tests/mocks/data';
import { settings } from '../../../settings';
import * as Mailer from '../../notifications/email/api';

jest.mock('@rocket.chat/core-services', () => ({
	ClientSafeError: jest.requireActual('@rocket.chat/core-services/dist/ClientSafeError').ClientSafeError,
}));
jest.mock('../../../settings', () => ({ settings: { get: jest.fn() } }));
jest.mock('../../notifications/email/api', () => ({ send: jest.fn() }));

const NOW = new Date('2026-10-15T12:00:00.000Z');
const FIVE_MINUTES = 5 * 60 * 1000;

const workspaceSettings: Record<string, SettingValue> = {
	Accounts_TwoFactorAuthentication_By_Email_Enabled: true,
	Accounts_TwoFactorAuthentication_By_Email_Code_Expiration: '3600',
	Accounts_TwoFactorAuthentication_Max_Invalid_Email_Code_Attempts: 5,
	From_Email: 'no-reply@example.com',
};

const users = {
	addEmailCodeByUserId: jest.fn(),
	removeEmailCodeOfUserId: jest.fn(),
	removeExpiredEmailCodeOfUserId: jest.fn(),
	incrementInvalidEmailCodeAttempt: jest.fn(),
	maxInvalidEmailCodeAttemptsReached: jest.fn(),
};

const challenges = {
	createTwoFactorChallenge: jest.fn(),
	findOneByPendingChallengeId: jest.fn(),
	removeByPendingChallengeId: jest.fn(),
};

const makeUser = async (code?: string): Promise<TwoFactorUser> =>
	createFakeUser({
		username: 'alice',
		emails: [{ address: 'alice@example.com', verified: true }],
		services: {
			email2fa: { enabled: true, changedAt: NOW },
			...(code && { emailCode: { code: await bcrypt.hash(code, 4), expire: new Date(NOW.getTime() + FIVE_MINUTES), attempts: 0 } }),
		},
	});

describe('EmailCheckForOAuth', () => {
	beforeAll(() => {
		mockModel('Users', users);
		mockModel('TwoFactorChallenges', challenges);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers({ now: NOW });
		jest.mocked(settings.get).mockImplementation((key: string) => workspaceSettings[key]);
		users.addEmailCodeByUserId.mockResolvedValue({ modifiedCount: 1 });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('emails a code to the user and returns the challenge to answer', async () => {
		challenges.createTwoFactorChallenge.mockResolvedValue('challenge-id');
		const user = await makeUser();

		await expect(new EmailCheckForOAuth().sendTwoFactorChallenge(user)).resolves.toBe('challenge-id');

		expect(challenges.createTwoFactorChallenge).toHaveBeenCalledWith(user._id, 'email');
		expect(jest.mocked(Mailer.send).mock.calls.map(([email]) => email.to)).toEqual(['alice@example.com']);
	});

	it('accepts the emailed code for a pending challenge and closes the challenge', async () => {
		challenges.findOneByPendingChallengeId.mockResolvedValue({ _id: 'challenge-id' });

		await expect(new EmailCheckForOAuth().verifyEmailTwoFactorChallenge(await makeUser('123456'), 'challenge-id', '123456')).resolves.toBe(
			true,
		);

		expect(challenges.removeByPendingChallengeId).toHaveBeenCalledWith('challenge-id');
	});

	it('refuses a wrong code and keeps the challenge open', async () => {
		challenges.findOneByPendingChallengeId.mockResolvedValue({ _id: 'challenge-id' });

		await expect(new EmailCheckForOAuth().verifyEmailTwoFactorChallenge(await makeUser('123456'), 'challenge-id', '654321')).resolves.toBe(
			false,
		);

		expect(challenges.removeByPendingChallengeId).not.toHaveBeenCalled();
	});

	it('refuses a challenge that is not pending', async () => {
		challenges.findOneByPendingChallengeId.mockResolvedValue(null);

		await expect(new EmailCheckForOAuth().verifyEmailTwoFactorChallenge(await makeUser('123456'), 'other-id', '123456')).resolves.toBe(
			false,
		);
	});

	it('tells the user when the challenge expired', async () => {
		challenges.findOneByPendingChallengeId.mockResolvedValue({ _id: 'challenge-id', expireAt: new Date(NOW.getTime() - 1) });

		await expect(
			new EmailCheckForOAuth().verifyEmailTwoFactorChallenge(await makeUser('123456'), 'challenge-id', '123456'),
		).rejects.toMatchObject({ error: 'error-challenge-expired' });
		expect(challenges.removeByPendingChallengeId).not.toHaveBeenCalled();
	});
});
