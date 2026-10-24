import type { IUser } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';

import { compareUserPasswordHistory, getPasswordHistoryLength } from './compareUserPasswordHistory';
import { settings } from '../settings';

jest.mock('meteor/accounts-base', () => ({ Accounts: { _checkPasswordAsync: jest.fn() } }), { virtual: true });
jest.mock('../settings', () => ({ settings: { get: jest.fn() } }));

const checkPassword = (Accounts as unknown as { _checkPasswordAsync: jest.Mock })._checkPasswordAsync;
const getSetting = settings.get as unknown as jest.Mock;

const makeUser = (passwordHistory: string[]) =>
	({
		_id: 'user-id',
		services: { password: { bcrypt: 'current-hash' }, passwordHistory },
	}) as unknown as IUser;

const withSettings = (values: Record<string, unknown>) => getSetting.mockImplementation((key: string) => values[key]);

describe('getPasswordHistoryLength', () => {
	it.each([
		[5, 5],
		[0, 0],
		[-1, 0],
		['', 0],
		[undefined, 0],
	])('returns %p as %p', (amount, expected) => {
		withSettings({ Accounts_Password_History_Amount: amount });

		expect(getPasswordHistoryLength()).toBe(expected);
	});
});

describe('compareUserPasswordHistory', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		checkPassword.mockImplementation(async (user: IUser) =>
			user.services?.password?.bcrypt === 'reused-hash' ? {} : { error: new Error('Incorrect password') },
		);
	});

	it('rejects a password found in the most recent history entries', async () => {
		withSettings({ Accounts_Password_History_Enabled: true, Accounts_Password_History_Amount: 2 });

		await expect(compareUserPasswordHistory(makeUser(['old-hash', 'reused-hash']), { plain: 'reused' })).resolves.toBe(false);
	});

	it('ignores history entries older than the configured length', async () => {
		withSettings({ Accounts_Password_History_Enabled: true, Accounts_Password_History_Amount: 1 });

		await expect(compareUserPasswordHistory(makeUser(['reused-hash', 'old-hash']), { plain: 'reused' })).resolves.toBe(true);
	});

	it.each([0, -1])('blocks no previous passwords when the history length is %s', async (amount) => {
		withSettings({ Accounts_Password_History_Enabled: true, Accounts_Password_History_Amount: amount });

		await expect(compareUserPasswordHistory(makeUser(['reused-hash', 'old-hash']), { plain: 'reused' })).resolves.toBe(true);
		expect(checkPassword).not.toHaveBeenCalled();
	});

	it('restores the current password hash after checking the history', async () => {
		withSettings({ Accounts_Password_History_Enabled: true, Accounts_Password_History_Amount: 5 });
		const user = makeUser(['old-hash', 'reused-hash']);

		await compareUserPasswordHistory(user, { plain: 'reused' });

		expect(user.services?.password?.bcrypt).toBe('current-hash');
	});
});
