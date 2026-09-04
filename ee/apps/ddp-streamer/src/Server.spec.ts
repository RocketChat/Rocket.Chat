import { MeteorService } from '@rocket.chat/core-services';
import WebSocket from 'ws';

import { Server } from './Server';
import type { IPacket } from './types/IPacket';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	MeteorService: {
		callMethodWithToken: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const mockCallMethodWithToken = jest.mocked(MeteorService.callMethodWithToken);

function makeClient(readyState: number = WebSocket.OPEN) {
	return {
		ws: { readyState },
		userId: 'user1',
		userToken: 'token1',
		send: jest.fn(),
	} as unknown as Parameters<Server['call']>[0];
}

function makePacket(method: string, id = 'test-id'): IPacket {
	return { msg: 'method', method, id, params: [] } as unknown as IPacket;
}

describe('Server.call', () => {
	let server: Server;

	beforeEach(() => {
		server = new Server();
		jest.clearAllMocks();
	});

	describe('when the method is delegated to MeteorService', () => {
		it('returns the result value from MeteorService', async () => {
			mockCallMethodWithToken.mockResolvedValue({ result: 'some-value' } as any);
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('someMethod'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), 'some-value');
		});

		it('does not return an error when the method returns void', async () => {
			mockCallMethodWithToken.mockResolvedValue({ result: undefined } as any);
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('setAvatarFromService'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), undefined);
		});

		it('calls result with an error when MeteorService throws', async () => {
			mockCallMethodWithToken.mockRejectedValue(new Error('boom'));
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('someMethod'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), null, expect.any(Error));
		});
	});

	describe('when the method is registered locally', () => {
		it('returns the result value from the local method', async () => {
			server.methods({ localMethod: async () => 'local-result' });
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('localMethod'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), 'local-result');
		});

		it('does not return an error when the local method returns void', async () => {
			server.methods({ voidMethod: async () => undefined });
			const client = makeClient();
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('voidMethod'));

			expect(resultSpy).toHaveBeenCalledWith(client, expect.objectContaining({ id: 'test-id' }), undefined);
		});
	});

	describe('when the client WebSocket is not open', () => {
		it('does nothing', async () => {
			const client = makeClient(WebSocket.CLOSED);
			const resultSpy = jest.spyOn(server, 'result');

			await server.call(client, makePacket('anyMethod'));

			expect(resultSpy).not.toHaveBeenCalled();
			expect(mockCallMethodWithToken).not.toHaveBeenCalled();
		});
	});
});

describe('Server.parse', () => {
	const server = new Server();

	it('parses a text DDP frame', () => {
		const packet = server.parse('{"msg":"ping","id":"1"}', false);
		expect(packet).toEqual({ msg: 'ping', id: '1' });
	});

	it('decodes UTF-8 from a binary frame instead of throwing', () => {
		const packet = server.parse(Buffer.from('{"msg":"ping","id":"1"}', 'utf8'), true);
		expect(packet).toEqual({ msg: 'ping', id: '1' });
	});

	it('unwraps the SockJS array-frame format used by meteor clients', () => {
		const inner = JSON.stringify({ msg: 'ping', id: '2' });
		const wrapped = JSON.stringify([inner]);
		const packet = server.parse(wrapped, false);
		expect(packet).toEqual({ msg: 'ping', id: '2' });
	});
});

describe('Server.call metrics', () => {
	const makeMetrics = () => ({
		register: jest.fn(),
		hasMetric: jest.fn(),
		increment: jest.fn(),
		decrement: jest.fn(),
		set: jest.fn(),
		observe: jest.fn(),
		reset: jest.fn(),
		resetAll: jest.fn(),
		timer: jest.fn().mockReturnValue(() => 0),
	});

	let server: Server;
	let metrics: ReturnType<typeof makeMetrics>;

	beforeEach(() => {
		server = new Server();
		metrics = makeMetrics();
		server.setMetrics(metrics);
		jest.clearAllMocks();
	});

	it('increments ddp_method_total with the namespace and ok status on success', async () => {
		mockCallMethodWithToken.mockResolvedValue({ result: 'value' } as any);
		await server.call(makeClient(), makePacket('livechat:doSomething'));
		expect(metrics.increment).toHaveBeenCalledWith('ddp_method_total', { namespace: 'livechat', status: 'ok' }, 1);
	});

	it('increments ddp_method_total with status=error when MeteorService rejects', async () => {
		mockCallMethodWithToken.mockRejectedValue(new Error('boom'));
		await server.call(makeClient(), makePacket('meteor.loginWithPassword'));
		expect(metrics.increment).toHaveBeenCalledWith('ddp_method_total', { namespace: 'meteor', status: 'error' }, 1);
	});

	it('uses the full method name as the namespace when the method has no separator', async () => {
		mockCallMethodWithToken.mockResolvedValue({ result: undefined } as any);
		await server.call(makeClient(), makePacket('sendMessage'));
		expect(metrics.increment).toHaveBeenCalledWith('ddp_method_total', { namespace: 'sendMessage', status: 'ok' }, 1);
	});
});
