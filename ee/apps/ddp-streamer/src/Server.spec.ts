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
