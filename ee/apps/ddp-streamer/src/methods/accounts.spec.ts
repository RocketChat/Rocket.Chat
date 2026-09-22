import { Account, MeteorError } from '@rocket.chat/core-services';

import { Server } from '../Server';
import { makeClient, makePacket, sentPackets } from '../__tests__/helpers';
import { WS_ERRORS } from '../constants';
import { ConnectionLifecycle } from '../lifecycle';
import { registerAccountMethods } from './accounts';

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
	let client: ReturnType<typeof makeClient>;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		server = new Server();
		lifecycle = new ConnectionLifecycle();
		registerAccountMethods(server, lifecycle);
		client = makeClient();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('login', () => {
		const tokenExpires = new Date(0);

		it('stores the credentials on the client and announces the login before sending the result', async () => {
			mockLogin.mockResolvedValue({ uid: 'user2', hashedToken: 'hashed', token: 'plain', tokenExpires, type: 'resume' } as any);
			const loggedIn = jest.fn(() => {
				expect(client.send).not.toHaveBeenCalled();
			});
			lifecycle.on('loggedIn', loggedIn);

			await server.call(client, { ...makePacket('login'), params: [{ resume: 'plain' }] });

			expect(mockLogin).toHaveBeenCalledWith({ resume: 'plain' });
			expect(client.userId).toBe('user2');
			expect(client.userToken).toBe('hashed');
			expect(client.connection.loginToken).toBe('hashed');
			expect(loggedIn).toHaveBeenCalledWith(client);
			expect(sentPackets(client)).toEqual([
				{ msg: 'result', id: 'test-id', result: { id: 'user2', token: 'plain', tokenExpires, type: 'resume' } },
				{ msg: 'updated', methods: ['test-id'] },
			]);
		});

		it('rejects an expired token with a 403 and announces nothing', async () => {
			mockLogin.mockResolvedValue(undefined as any);
			const loggedIn = jest.fn();
			lifecycle.on('loggedIn', loggedIn);

			await server.call(client, { ...makePacket('login'), params: [{ resume: 'stale' }] });

			expect(loggedIn).not.toHaveBeenCalled();
			expect(client.userId).toBe('user1');
			expect(sentPackets(client)[0]).toEqual({
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

			await server.call(client, makePacket('logout'));

			expect(mockLogout).toHaveBeenCalledWith({ userId: 'user1', token: 'token1' });
			expect(seenUserId).toEqual(['user1']);
			expect(client.userId).toBeUndefined();
			expect(client.userToken).toBeUndefined();
			expect(sentPackets(client)).toEqual([
				{ msg: 'result', id: 'test-id' },
				{ msg: 'updated', methods: ['test-id'] },
			]);
			expect(client.ws.close).not.toHaveBeenCalled();

			jest.advanceTimersByTime(1);

			expect(client.ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
		});

		it('still announces and closes for an anonymous client without revoking anything', async () => {
			client.userId = undefined;
			const loggedOut = jest.fn();
			lifecycle.on('loggedOut', loggedOut);

			await server.call(client, makePacket('logout'));
			jest.advanceTimersByTime(1);

			expect(mockLogout).not.toHaveBeenCalled();
			expect(loggedOut).toHaveBeenCalledWith(client);
			expect(client.ws.close).toHaveBeenCalledWith(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
		});
	});
});
