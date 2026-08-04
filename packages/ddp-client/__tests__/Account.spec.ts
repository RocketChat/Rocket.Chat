import WS from 'jest-websocket-mock';

import { handleConnection, handleMethod } from './helpers';
import { DDPSDK } from '../src/DDPSDK';

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
		expect((user?.tokenExpires as Date)?.toISOString()).toBe(new Date(messageResult.tokenExpires.$date).toISOString());
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
		expect((user?.tokenExpires as Date)?.toISOString()).toBe(new Date(messageResult.tokenExpires.$date).toISOString());
		expect(user?.id).toBe(messageResult.id);
	});

	it('should logout', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const loginResult = {
			id: '123',
			token: 'token',
			tokenExpires: { $date: 99999999 },
		};

		await handleMethod(server, 'login', [{ resume: 'token' }], JSON.stringify(loginResult), sdk.account.loginWithToken('token'));

		const cb = jest.fn();
		sdk.account.on('uid', cb);

		await handleMethod(server, 'logout', [], '{}', sdk.account.logout());

		// uid setter only fires on transitions, so logging out from a logged-in
		// state emits exactly once (string → undefined).
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith(undefined);

		const { user } = sdk.account;
		expect(user).toBeUndefined();
	});

	it('should fire onLogin / onLogout on uid transitions only', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const onLogin = jest.fn();
		const onLogout = jest.fn();
		sdk.account.onLogin(onLogin);
		sdk.account.onLogout(onLogout);

		const loginResult = {
			id: '123',
			token: 'token',
			tokenExpires: { $date: 99999999 },
		};
		await handleMethod(server, 'login', [{ resume: 'token' }], JSON.stringify(loginResult), sdk.account.loginWithToken('token'));

		expect(onLogin).toHaveBeenCalledTimes(1);
		expect(onLogout).not.toHaveBeenCalled();

		await handleMethod(server, 'logout', [], '{}', sdk.account.logout());

		expect(onLogin).toHaveBeenCalledTimes(1);
		expect(onLogout).toHaveBeenCalledTimes(1);
	});

	it('should fan out emailVerificationLink and pageLoadLogin events', () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		const verify = jest.fn();
		const pageLoad = jest.fn();
		const stopVerify = sdk.account.onEmailVerificationLink(verify);
		sdk.account.onPageLoadLogin(pageLoad);

		sdk.account.emit('emailVerificationLink', 'tok-1');
		sdk.account.emit('pageLoadLogin', { error: 'totp-required' });

		expect(verify).toHaveBeenCalledWith('tok-1');
		expect(pageLoad).toHaveBeenCalledWith({ error: 'totp-required' });

		stopVerify();
		sdk.account.emit('emailVerificationLink', 'tok-2');
		expect(verify).toHaveBeenCalledTimes(1);
	});
});
