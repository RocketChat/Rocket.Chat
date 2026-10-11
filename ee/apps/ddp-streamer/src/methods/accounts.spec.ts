import { Account, MeteorError } from '@rocket.chat/core-services';

import { registerAccountMethods } from './accounts';
import { makeSession, makePacket, sentPackets } from '../__tests__/helpers';
import { Server } from '../ddp/Server';
import { WS_ERRORS } from '../ddp/constants';
import { ConnectionLifecycle } from '../ddp/lifecycle';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	Account: {
		login: jest.fn(),
		logout: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const mockLogin = jest.mocked(Account.login);
const mockLogout = jest.mocked(Account.logout);

describe('account methods', () => {
	let server: Server;
	let lifecycle: ConnectionLifecycle;
	let session: ReturnType<typeof makeSession>;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		server = new Server();
		lifecycle = new ConnectionLifecycle();
		registerAccountMethods(server, lifecycle);
		session = makeSession();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('login', () => {
		const tokenExpires = new Date(0);

		it('stores the credentials on the session and announces the login before sending the result', async () => {
			mockLogin.mockResolvedValue({ uid: 'user2', hashedToken: 'hashed', token: 'plain', tokenExpires, type: 'resume' } as any);
			const loggedIn = jest.fn(() => {
				expect(session.send).not.toHaveBeenCalled();
			});
			lifecycle.on('loggedIn', loggedIn);

			await server.call(session, { ...makePacket('login'), params: [{ resume: 'plain' }] });

			expect(mockLogin).toHaveBeenCalledWith({ resume: 'plain' });
			expect(session.userId).toBe('user2');
			expect(session.userToken).toBe('hashed');
			expect(session.connection.loginToken).toBe('hashed');
			expect(loggedIn).toHaveBeenCalledWith(session);
			expect(sentPackets(session)).toEqual([
				{ msg: 'result', id: 'test-id', result: { id: 'user2', token: 'plain', tokenExpires, type: 'resume' } },
				{ msg: 'updated', methods: ['test-id'] },
			]);
		});

		it('rejects an expired token with a 403 and announces nothing', async () => {
			mockLogin.mockResolvedValue(undefined as any);
			const loggedIn = jest.fn();
			lifecycle.on('loggedIn', loggedIn);

			await server.call(session, { ...makePacket('login'), params: [{ resume: 'stale' }] });

			expect(loggedIn).not.toHaveBeenCalled();
			expect(session.userId).toBe('user1');
			expect(sentPackets(session)[0]).toEqual({
				msg: 'result',
				id: 'test-id',
				error: new MeteorError(403, "You've been logged out by the server. Please log in again").toJSON(),
			});
		});
	});

	describe('logout', () => {
		it('revokes the token, announces the logout while the user is still known, then clears and closes', async () => {
			const seenUserId: (string | undefined)[] = [];
			lifecycle.on('loggedOut', (loggedOut) => seenUserId.push(loggedOut.userId));

			await server.call(session, makePacket('logout'));

			expect(mockLogout).toHaveBeenCalledWith({ userId: 'user1', token: 'token1' });
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

		it('still announces and closes for an anonymous session without revoking anything', async () => {
			session.userId = undefined;
			const loggedOut = jest.fn();
			lifecycle.on('loggedOut', loggedOut);

			await server.call(session, makePacket('logout'));
			jest.advanceTimersByTime(1);

			expect(mockLogout).not.toHaveBeenCalled();
			expect(loggedOut).toHaveBeenCalledWith(session);
			expect(session.ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
		});
	});
});
