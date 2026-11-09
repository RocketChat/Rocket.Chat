import type { SettingValue } from '@rocket.chat/core-typings';
import type { IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import bcrypt from 'bcrypt';

import { EmailCheck } from './EmailCheck';
import type { TwoFactorUser } from './ICodeCheck';
import { createFakeUser } from '../../../../tests/mocks/data';
import { settings } from '../../../settings';
import { i18n } from '../../i18n';
import * as Mailer from '../../notifications/email/api';

jest.mock('meteor/accounts-base', () => ({ Accounts: { _bcryptRounds: () => 4 } }), { virtual: true });
jest.mock('../../../settings', () => ({ settings: { get: jest.fn() } }));
jest.mock('../../notifications/email/api', () => ({ send: jest.fn() }));

const users = {
	addEmailCodeByUserId: jest.fn(),
	removeEmailCodeOfUserId: jest.fn(),
	removeExpiredEmailCodeOfUserId: jest.fn(),
	incrementInvalidEmailCodeAttempt: jest.fn(),
	maxInvalidEmailCodeAttemptsReached: jest.fn(),
};
registerModel('IUsersModel', users as unknown as IUsersModel);

const NOW = new Date('2026-10-15T12:00:00.000Z');
const FIVE_MINUTES = 5 * 60 * 1000;

let workspaceSettings: Record<string, SettingValue>;

const makeUser = (overrides: Partial<TwoFactorUser> = {}): TwoFactorUser =>
	createFakeUser({
		username: 'alice',
		emails: [{ address: 'alice@example.com', verified: true }],
		services: { email2fa: { enabled: true, changedAt: NOW } },
		...overrides,
	});

const withStoredCode = async (code: string, expire: Date, attempts = 0): Promise<TwoFactorUser> =>
	makeUser({
		services: {
			email2fa: { enabled: true, changedAt: NOW },
			emailCode: { code: await bcrypt.hash(code, 4), expire, attempts },
		},
	});

const sentEmails = () => jest.mocked(Mailer.send).mock.calls.map(([email]) => email);

describe('EmailCheck', () => {
	let emailCheck: EmailCheck;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers({ now: NOW });

		workspaceSettings = {
			Accounts_TwoFactorAuthentication_By_Email_Enabled: true,
			Accounts_TwoFactorAuthentication_By_Email_Code_Expiration: '3600',
			Accounts_TwoFactorAuthentication_Max_Invalid_Email_Code_Attempts: 5,
			From_Email: 'no-reply@example.com',
		};
		jest.mocked(settings.get).mockImplementation((key: string) => workspaceSettings[key]);
		users.addEmailCodeByUserId.mockResolvedValue({ modifiedCount: 1 });

		emailCheck = new EmailCheck();
	});

	describe('isEnabled', () => {
		it('is enabled for a user with email 2FA on and a verified email', () => {
			expect(emailCheck.isEnabled(makeUser())).toBe(true);
		});

		it('is not enabled for a user who has not turned email 2FA on', () => {
			expect(emailCheck.isEnabled(makeUser({ services: { email2fa: { enabled: false, changedAt: NOW } } }))).toBe(false);
		});

		it('is not enabled for a user without email addresses', () => {
			expect(emailCheck.isEnabled(makeUser({ emails: undefined }))).toBe(false);
		});

		it('is not enabled for a user whose only email is unverified', () => {
			expect(emailCheck.isEnabled(makeUser({ emails: [{ address: 'alice@example.com', verified: false }] }))).toBe(false);
		});

		it('is not enabled for an OAuth user when email 2FA is not available for OAuth users', () => {
			expect(emailCheck.isEnabled(makeUser({ services: { google: {}, email2fa: { enabled: true, changedAt: NOW } } }))).toBe(false);
		});
	});

	describe('verify', () => {
		it('rejects a matching code when email 2FA is disabled in the workspace', async () => {
			workspaceSettings.Accounts_TwoFactorAuthentication_By_Email_Enabled = false;
			const user = await withStoredCode('123456', new Date(NOW.getTime() + FIVE_MINUTES));

			await expect(emailCheck.verify(user, '123456')).resolves.toBe(false);
			expect(users.removeEmailCodeOfUserId).not.toHaveBeenCalled();
		});

		it('rejects any code when the user has no stored code', async () => {
			await expect(emailCheck.verify(makeUser(), '123456')).resolves.toBe(false);
			expect(users.incrementInvalidEmailCodeAttempt).not.toHaveBeenCalled();
		});

		it('rejects a matching code once it has expired', async () => {
			const user = await withStoredCode('123456', new Date(NOW.getTime() - 1));

			await expect(emailCheck.verify(user, '123456')).resolves.toBe(false);
			expect(users.removeEmailCodeOfUserId).not.toHaveBeenCalled();
			expect(users.incrementInvalidEmailCodeAttempt).not.toHaveBeenCalled();
		});

		it('accepts the code typed with separators and consumes it', async () => {
			const user = await withStoredCode('123456', new Date(NOW.getTime() + FIVE_MINUTES));

			await expect(emailCheck.verify(user, ' 123-456 ')).resolves.toBe(true);
			expect(users.removeEmailCodeOfUserId).toHaveBeenCalledWith(user._id);
			expect(users.incrementInvalidEmailCodeAttempt).not.toHaveBeenCalled();
		});

		it('rejects a matching code once the failed-attempt limit is reached', async () => {
			const user = await withStoredCode('123456', new Date(NOW.getTime() + FIVE_MINUTES), 5);

			await expect(emailCheck.verify(user, '123456')).resolves.toBe(false);
			expect(users.removeEmailCodeOfUserId).not.toHaveBeenCalled();
		});

		it('rejects a wrong code and counts the failed attempt', async () => {
			const user = await withStoredCode('123456', new Date(NOW.getTime() + FIVE_MINUTES));

			await expect(emailCheck.verify(user, '654321')).resolves.toBe(false);
			expect(users.incrementInvalidEmailCodeAttempt).toHaveBeenCalledWith(user._id);
			expect(users.removeEmailCodeOfUserId).not.toHaveBeenCalled();
		});
	});

	describe('sendEmailCode', () => {
		it('stores a hash of the emailed six-digit code, expiring after the configured seconds', async () => {
			const user = makeUser();

			await emailCheck.sendEmailCode(user);

			const [[userId, hash, expire]] = users.addEmailCodeByUserId.mock.calls;
			const [{ data, text, html }] = sentEmails();
			expect(userId).toBe(user._id);
			expect(expire).toEqual(new Date(NOW.getTime() + 3600 * 1000));
			const code = String(data?.code);
			expect(code).toMatch(/^\d{3}-\d{3}$/);
			await expect(bcrypt.compare(code.replace('-', ''), hash)).resolves.toBe(true);
			expect(text).toContain('__code__');
			expect(html).toContain('__code__');
		});

		it('sends the same code to every verified address and skips unverified ones', async () => {
			const user = makeUser({
				emails: [
					{ address: 'first@example.com', verified: true },
					{ address: 'unverified@example.com', verified: false },
					{ address: 'second@example.com', verified: true },
				],
			});

			await emailCheck.sendEmailCode(user);

			const emails = sentEmails();
			expect(emails.map(({ to }) => to)).toEqual(['first@example.com', 'second@example.com']);
			expect(emails[1].data?.code).toBe(emails[0].data?.code);
			expect(emails[0].from).toBe('no-reply@example.com');
		});

		it.each([
			{ case: "the user's language", userLanguage: 'pt-BR', workspaceLanguage: 'de', expected: 'pt-BR' },
			{ case: 'the workspace language when the user has none', userLanguage: undefined, workspaceLanguage: 'de', expected: 'de' },
			{ case: 'English when neither is set', userLanguage: undefined, workspaceLanguage: '', expected: 'en' },
		])('writes the email in $case', async ({ userLanguage, workspaceLanguage, expected }) => {
			workspaceSettings.Language = workspaceLanguage;

			await emailCheck.sendEmailCode(makeUser({ language: userLanguage }));

			const [{ text, html }] = sentEmails();
			expect(text).toContain(i18n.t('Here_is_your_authentication_code', { lng: expected }));
			expect(html).toContain(i18n.t('Do_not_provide_this_code_to_anyone', { lng: expected }));
		});

		it('does not email a code when one was sent in the last minute', async () => {
			users.addEmailCodeByUserId.mockResolvedValue({ modifiedCount: 0 });

			await expect(emailCheck.sendEmailCode(makeUser())).resolves.toBe(false);
			expect(users.addEmailCodeByUserId.mock.calls[0][3]).toEqual(new Date(NOW.getTime() - 60_000));
			expect(Mailer.send).not.toHaveBeenCalled();
		});

		it('fails when the email cannot be delivered', async () => {
			const error = new Error('SMTP unavailable');
			jest.mocked(Mailer.send).mockRejectedValueOnce(error);

			await expect(emailCheck.sendEmailCode(makeUser())).rejects.toBe(error);
		});
	});

	describe('processInvalidCode', () => {
		let attempts: number | undefined;

		beforeEach(() => {
			users.maxInvalidEmailCodeAttemptsReached.mockImplementation(async (_userId, maxAttempts) => (attempts ?? 0) >= maxAttempts);
		});

		it('reuses a pending code without sending another email', async () => {
			attempts = 4;
			const expire = new Date(NOW.getTime() + FIVE_MINUTES);
			const user = await withStoredCode('123456', expire, attempts);

			await expect(emailCheck.processInvalidCode(user)).resolves.toEqual({
				emailOrUsername: 'alice',
				codeGenerated: false,
				codeExpires: expire,
			});
			expect(Mailer.send).not.toHaveBeenCalled();
			expect(users.addEmailCodeByUserId).not.toHaveBeenCalled();
		});

		it('purges expired codes and emails a new one when the user has none', async () => {
			attempts = undefined;
			const user = makeUser();

			await expect(emailCheck.processInvalidCode(user)).resolves.toEqual({ emailOrUsername: 'alice', codeGenerated: true });
			expect(users.removeExpiredEmailCodeOfUserId).toHaveBeenCalledWith(user._id);
			expect(users.addEmailCodeByUserId).toHaveBeenCalledTimes(1);
			expect(sentEmails().map(({ to }) => to)).toEqual(['alice@example.com']);
		});

		it('emails a new code once the configured failed-attempt limit is reached', async () => {
			attempts = 5;
			const user = await withStoredCode('123456', new Date(NOW.getTime() + FIVE_MINUTES), attempts);

			await expect(emailCheck.processInvalidCode(user)).resolves.toEqual({ emailOrUsername: 'alice', codeGenerated: true });
			expect(Mailer.send).toHaveBeenCalledTimes(1);
		});

		it('reports that no code was generated when one was sent in the last minute', async () => {
			attempts = 5;
			users.addEmailCodeByUserId.mockResolvedValue({ modifiedCount: 0 });
			const user = await withStoredCode('123456', new Date(NOW.getTime() + FIVE_MINUTES), attempts);

			await expect(emailCheck.processInvalidCode(user)).resolves.toEqual({ emailOrUsername: 'alice', codeGenerated: false });
			expect(Mailer.send).not.toHaveBeenCalled();
		});

		// This is wrong: the cutoff sits five minutes in the past, so a code that already expired is reused,
		// and verify() then rejects it without a new email being sent.
		it('reuses a code that expired less than five minutes ago', async () => {
			attempts = 0;
			const expire = new Date(NOW.getTime() - FIVE_MINUTES + 1);
			const user = await withStoredCode('123456', expire, attempts);

			await expect(emailCheck.processInvalidCode(user)).resolves.toMatchObject({ codeGenerated: false, codeExpires: expire });
			expect(Mailer.send).not.toHaveBeenCalled();
		});

		it('emails a new code when the stored one expired five minutes ago', async () => {
			attempts = 0;
			const user = await withStoredCode('123456', new Date(NOW.getTime() - FIVE_MINUTES), attempts);

			await expect(emailCheck.processInvalidCode(user)).resolves.toMatchObject({ codeGenerated: true });
			expect(Mailer.send).toHaveBeenCalledTimes(1);
		});

		it('identifies a user without a username by the first verified email', async () => {
			attempts = undefined;
			const user = makeUser({
				username: undefined,
				emails: [
					{ address: 'unverified@example.com', verified: false },
					{ address: 'verified@example.com', verified: true },
				],
			});

			await expect(emailCheck.processInvalidCode(user)).resolves.toEqual({
				emailOrUsername: 'verified@example.com',
				codeGenerated: true,
			});
		});
	});
});
