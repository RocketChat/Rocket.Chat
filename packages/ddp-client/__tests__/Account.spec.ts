import WS from 'jest-websocket-mock';

import { handleConnection, handleMethod } from './helpers';
import { ClientStreamImpl } from '../src/ClientStream';
import { DDPDispatcher } from '../src/DDPDispatcher';
import { DDPSDK } from '../src/DDPSDK';
import { AccountImpl } from '../src/types/Account';

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

	it.each([
		['an EJSON-decoded Date', new Date(1700000000000)],
		['a raw $date number', { $date: 1700000000000 }],
		['a raw $date string', { $date: '1700000000000' }],
	])('should read the token expiry from %s', async (_, tokenExpires) => {
		const ddp = new DDPDispatcher();
		const account = new AccountImpl(new ClientStreamImpl(ddp, ddp));
		const sent: { id: string }[] = [];
		ddp.onDispatchMessage((message) => sent.push(JSON.parse(message)));

		const login = account.loginWithToken('token');
		// Bypasses decoding so the result carries the value as given.
		ddp.emit(`result/${sent[0].id}`, { msg: 'result', id: sent[0].id, result: { id: 'uid', token: 'token2', tokenExpires } });

		await expect(login).resolves.toEqual({ id: 'uid', token: 'token2', tokenExpires: new Date(1700000000000) });
		expect(account.user?.tokenExpires).toEqual(new Date(1700000000000));
	});

	it('should adopt and forget credentials obtained outside the SDK', () => {
		const ddp = new DDPDispatcher();
		const account = new AccountImpl(new ClientStreamImpl(ddp, ddp));
		const onLogin = jest.fn();
		const onLogout = jest.fn();
		account.onLogin(onLogin);
		account.onLogout(onLogout);

		account.setCredentials({ id: 'uid', token: 'token', tokenExpires: { $date: 1700000000000 } });

		expect(account.uid).toBe('uid');
		expect(account.user).toEqual({ id: 'uid', token: 'token', tokenExpires: new Date(1700000000000) });
		expect(onLogin).toHaveBeenCalledTimes(1);

		account.clearCredentials();

		expect(account.uid).toBeUndefined();
		expect(account.user).toBeUndefined();
		expect(onLogout).toHaveBeenCalledTimes(1);
	});

	it('should only take the logged-in user document from the users collection', () => {
		const ddp = new DDPDispatcher();
		const account = new AccountImpl(new ClientStreamImpl(ddp, ddp));
		account.uid = 'me';
		account.user = { id: 'me', username: 'me' };

		ddp.handleMessage(JSON.stringify({ msg: 'added', collection: 'users', id: 'other', fields: { username: 'other' } }));
		expect(account.user).toEqual({ id: 'me', username: 'me' });

		ddp.handleMessage(JSON.stringify({ msg: 'changed', collection: 'users', id: 'me', fields: { username: 'renamed' } }));
		expect(account.user).toEqual({ id: 'me', username: 'renamed' });
	});

	it('should match a user id Meteor sends with the ObjectID-escaping dash', () => {
		const ddp = new DDPDispatcher();
		const account = new AccountImpl(new ClientStreamImpl(ddp, ddp));
		account.uid = '6ad69395009997a9b9c71d04';

		ddp.handleMessage(
			JSON.stringify({ msg: 'added', collection: 'users', id: '-6ad69395009997a9b9c71d04', fields: { username: 'admin' } }),
		);

		expect(account.user).toEqual({ id: '6ad69395009997a9b9c71d04', username: 'admin' });
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
