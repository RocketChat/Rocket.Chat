import { ClientSafeError } from '@rocket.chat/core-services';
import WebSocket from 'ws';

import { Server } from '../Server';
import { makePacket, makeSession, sentPackets } from '../__tests__/helpers';
import { WS_ERRORS } from '../constants';
import { ConnectionLifecycle } from '../lifecycle';
import { registerAccountMethods } from './accounts';
import type { SessionAccounts } from './accounts';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const accounts = {
	login: jest.fn<ReturnType<SessionAccounts['login']>, Parameters<SessionAccounts['login']>>(),
	logout: jest.fn<ReturnType<SessionAccounts['logout']>, Parameters<SessionAccounts['logout']>>(),
};

describe('account methods', () => {
	const tokenExpires = new Date(0);
	const loginResult = { id: 'user2', token: 'plain', tokenExpires, type: 'resume' };

	let server: Server;
	let lifecycle: ConnectionLifecycle;
	let session: ReturnType<typeof makeSession>;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		accounts.login.mockResolvedValue({ result: loginResult, hashedToken: 'hashed' });
		accounts.logout.mockResolvedValue(undefined);
		server = new Server();
		lifecycle = new ConnectionLifecycle();
		registerAccountMethods(server, lifecycle, accounts);
		session = makeSession();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('login', () => {
		it('stores the credentials on the session and announces the login before sending the result', async () => {
			const loggedIn = jest.fn(() => {
				expect(session.send).not.toHaveBeenCalled();
			});
			lifecycle.on('loggedIn', loggedIn);

			await server.call(session, { ...makePacket('login'), params: [{ resume: 'plain' }] });

			expect(accounts.login).toHaveBeenCalledWith(session, [{ resume: 'plain' }]);
			expect(session.userId).toBe('user2');
			expect(session.userToken).toBe('hashed');
			expect(session.connection.loginToken).toBe('hashed');
			expect(loggedIn).toHaveBeenCalledWith(session);
			expect(sentPackets(session)).toEqual([
				{ msg: 'result', id: 'test-id', result: loginResult },
				{ msg: 'updated', methods: ['test-id'] },
			]);
		});

		it('does not announce a login that finished after the socket closed', async () => {
			let finishLogin!: () => void;
			accounts.login.mockReturnValue(
				new Promise((resolve) => {
					finishLogin = () => resolve({ result: loginResult, hashedToken: 'hashed' });
				}),
			);
			const loggedIn = jest.fn();
			lifecycle.on('loggedIn', loggedIn);

			const call = server.call(session, makePacket('login'));
			session.ws.readyState = WebSocket.CLOSED;
			finishLogin();
			await call;

			expect(loggedIn).not.toHaveBeenCalled();
		});

		it('answers a refused login with its error, leaving the session and announcing nothing', async () => {
			accounts.login.mockRejectedValue(new ClientSafeError(403, 'Logged out'));
			const loggedIn = jest.fn();
			lifecycle.on('loggedIn', loggedIn);

			await server.call(session, makePacket('login'));

			expect(loggedIn).not.toHaveBeenCalled();
			expect(session.userId).toBe('user1');
			expect(sentPackets(session)[0]).toEqual({ msg: 'result', id: 'test-id', error: new ClientSafeError(403, 'Logged out').toJSON() });
		});
	});

	describe('logout', () => {
		it('logs out, announces the logout while the user is still known, then clears and closes', async () => {
			const seenUserId: (string | undefined)[] = [];
			lifecycle.on('loggedOut', (loggedOut) => seenUserId.push(loggedOut.userId));

			await server.call(session, makePacket('logout'));

			expect(accounts.logout).toHaveBeenCalledWith(session);
			expect(seenUserId).toEqual(['user1']);
			expect(session.userId).toBeUndefined();
			expect(session.userToken).toBeUndefined();
			expect(sentPackets(session)).toEqual([
				{ msg: 'result', id: 'test-id' },
				{ msg: 'updated', methods: ['test-id'] },
			]);
			expect(session.ws.close).not.toHaveBeenCalled();

			jest.advanceTimersByTime(1);

			expect(session.ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
		});
	});
});
