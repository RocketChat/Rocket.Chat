import { Account, ClientSafeError } from '@rocket.chat/core-services';

import { sessionAccounts } from './accounts';
import { makeSession } from '../__tests__/helpers';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	Account: {
		login: jest.fn(),
		logout: jest.fn().mockResolvedValue(undefined),
	},
}));

const mockLogin = jest.mocked(Account.login);
const mockLogout = jest.mocked(Account.logout);

describe('session accounts', () => {
	let session: ReturnType<typeof makeSession>;

	beforeEach(() => {
		jest.clearAllMocks();
		session = makeSession();
	});

	describe('login', () => {
		const tokenExpires = new Date(0);

		it('resumes the login and answers with the token the client sent, identified by its hash', async () => {
			mockLogin.mockResolvedValue({ uid: 'user2', hashedToken: 'hashed', token: 'plain', tokenExpires, type: 'resume' } as any);

			await expect(sessionAccounts.login(session, [{ resume: 'plain' }])).resolves.toEqual({
				result: { id: 'user2', token: 'plain', tokenExpires, type: 'resume' },
				hashedToken: 'hashed',
			});
			expect(mockLogin).toHaveBeenCalledWith({ resume: 'plain' });
		});

		it('rejects an expired token with a 403', async () => {
			mockLogin.mockResolvedValue(undefined as any);

			await expect(sessionAccounts.login(session, [{ resume: 'stale' }])).rejects.toEqual(
				new ClientSafeError(403, "You've been logged out by the server. Please log in again"),
			);
		});
	});

	describe('logout', () => {
		it("revokes the session's token", async () => {
			await sessionAccounts.logout(session);

			expect(mockLogout).toHaveBeenCalledWith({ userId: 'user1', token: 'token1' });
		});

		it('revokes nothing for an anonymous session', async () => {
			session.userId = undefined;

			await sessionAccounts.logout(session);

			expect(mockLogout).not.toHaveBeenCalled();
		});
	});
});
