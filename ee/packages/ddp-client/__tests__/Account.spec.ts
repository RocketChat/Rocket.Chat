import { ClientStreamImpl } from '../src/ClientStream';
import { DDPDispatcher } from '../src/DDPDispatcher';
import { AccountImpl } from '../src/types/Account';
// import type { MethodPayload } from '../src/types/methodsPayloads';

class DispatcherMock extends DDPDispatcher {
	lastPayloadId: string;

	call(method: string, params: any[] = []) {
		const payload = super.call(method, params);
		this.lastPayloadId = payload.id;
		return payload;
	}
}

describe('login', () => {
	it('should save credentials to user object - loginWithToken', async () => {
		const ws = new DispatcherMock();
		const client = new ClientStreamImpl(ws);

		const acc = new AccountImpl(client);

		const promise = acc.loginWithToken('token');

		const messageResult = {
			id: 123,
			token: 'token',
			tokenExpires: { $date: 99999999 },
		};

		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				result: messageResult,
				id: ws.lastPayloadId,
			}),
		);
		await promise;
		const { user } = acc;
		expect(user?.token).toBe(messageResult.token);
		expect(user?.tokenExpires?.toISOString()).toBe(new Date(messageResult.tokenExpires.$date).toISOString());
		expect(user?.id).toBe(messageResult.id);
	});

	it('should save credentials to user object - loginWithPassword', async () => {
		const ws = new DispatcherMock();
		const client = new ClientStreamImpl(ws);

		const acc = new AccountImpl(client);

		const promise = acc.loginWithPassword('username', 'password');

		const messageResult = {
			id: 123,
			token: 'token',
			tokenExpires: { $date: 99999999 },
		};

		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				result: messageResult,
				id: ws.lastPayloadId,
			}),
		);

		await promise;
		const { user } = acc;

		expect(user?.token).toBe(messageResult.token);
		expect(user?.tokenExpires?.toISOString()).toBe(new Date(messageResult.tokenExpires.$date).toISOString());
		expect(user?.id).toBe(messageResult.id);
	});

	it('should login with saved token on connection', async () => {
		const ws = new DispatcherMock();
		const client = new ClientStreamImpl(ws);

		const acc = new AccountImpl(client);

		const promise = acc.loginWithPassword('username', 'password');

		const messageResult = {
			id: 123,
			token: 'token',
			tokenExpires: { $date: 99999999 },
		};

		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				result: messageResult,
				id: ws.lastPayloadId,
			}),
		);

		await promise;

		// const cb = jest.fn();
		let count = 0;
		const loginFn = async (token: string) => {
			count += 1;
			const promise = acc.loginWithToken(token);
			ws.handleMessage(
				JSON.stringify({
					msg: 'result',
					result: messageResult,
					id: ws.lastPayloadId,
				}),
			);
			return promise;
		};

		acc.loginWithToken = loginFn;
		ws.emit('connection', { msg: 'connected', session: '123' });

		expect(count).toBe(1);
		// expect(cb).toBeCalledTimes(1);
	});
});
