import WS from 'jest-websocket-mock';

import { DDPSDK } from '../src/DDPSDK';
import { handleConnection, handleMethod } from './helpers';

let server: WS;

beforeEach(async () => {
	server = new WS('ws://localhost:1234/websocket');
});

afterEach(() => {
	server.close();
	WS.clean();
});

describe('login', () => {
	it('should save credentials to user object - loginWithToken', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const messageResult = {
			id: 123,
			token: 'token',
			tokenExpires: { $date: 99999999 },
		};

		await handleMethod(server, 'login', [{ resume: 'token' }], JSON.stringify(messageResult), sdk.account.loginWithToken('token'));

		const { user } = sdk.account;
		expect(user?.token).toBe(messageResult.token);
		expect(user?.tokenExpires?.toISOString()).toBe(new Date(messageResult.tokenExpires.$date).toISOString());
		expect(user?.id).toBe(messageResult.id);
	});

	it('should save credentials to user object - loginWithPassword', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const messageResult = {
			id: 123,
			token: 'token',
			tokenExpires: { $date: 99999999 },
		};

		await handleMethod(
			server,
			'login',
			[{ user: { username: 'username' }, password: { digest: 'password', algorithm: 'sha-256' } }],
			JSON.stringify(messageResult),
			sdk.account.loginWithPassword('username', 'password'),
		);

		const { user } = sdk.account;
		expect(user?.token).toBe(messageResult.token);
		expect(user?.tokenExpires?.toISOString()).toBe(new Date(messageResult.tokenExpires.$date).toISOString());
		expect(user?.id).toBe(messageResult.id);
	});

	it('should logout', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const messageResult = {
			id: 123,
			token: 'token',
			tokenExpires: { $date: 99999999 },
		};

		const cb = jest.fn();
		sdk.account.once('uid', cb);

		await handleMethod(server, 'logout', [], JSON.stringify(messageResult), sdk.account.logout());

		expect(cb).toHaveBeenCalledTimes(1);

		const { user } = sdk.account;
		expect(user).toBeUndefined();
	});
});
