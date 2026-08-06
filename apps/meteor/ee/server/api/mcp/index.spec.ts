import type { IUser } from '@rocket.chat/core-typings';

import { handleMcpGet, handleMcpPost } from './index';
import { handleRpcMessage } from './server';
import { settings } from '../../../../server/settings/cached';

jest.mock('./permissions', () => ({}));

jest.mock('./server', () => ({
	handleRpcMessage: jest.fn(),
}));

jest.mock('../../../../server/api', () => ({
	API: { v1: { addRoute: jest.fn() } },
}));

jest.mock('../../../../server/settings/cached', () => ({
	settings: { get: jest.fn() },
}));

const context = {
	bodyParams: { jsonrpc: '2.0', id: 1, method: 'ping' },
	userId: 'user-id',
	user: { _id: 'user-id' } as IUser,
	requestIp: '192.0.2.1',
	request: new Request('http://localhost/api/v1/mcp', { headers: { 'x-auth-token': 'auth-token' } }),
};

describe('MCP HTTP route', () => {
	beforeEach(() => {
		jest.mocked(settings.get).mockReturnValue(true);
		jest.mocked(handleRpcMessage).mockReset();
	});

	it('returns not found while MCP is disabled', async () => {
		jest.mocked(settings.get).mockReturnValue(false);

		await expect(handleMcpPost.call(context)).resolves.toMatchObject({ statusCode: 404 });
		expect(handleMcpGet()).toMatchObject({ statusCode: 404 });
	});

	it('rejects empty and oversized JSON-RPC batches', async () => {
		await expect(handleMcpPost.call({ ...context, bodyParams: [] })).resolves.toMatchObject({
			statusCode: 400,
			body: { error: { code: -32600 } },
		});
		await expect(
			handleMcpPost.call({ ...context, bodyParams: Array.from({ length: 21 }, () => context.bodyParams) }),
		).resolves.toMatchObject({
			statusCode: 400,
			body: { error: { code: -32600 } },
		});
		expect(handleRpcMessage).not.toHaveBeenCalled();
	});

	it('acknowledges notifications without a response body', async () => {
		jest.mocked(handleRpcMessage).mockResolvedValue(null);

		await expect(handleMcpPost.call(context)).resolves.toEqual({ statusCode: 202, body: {} });
	});

	it('returns method not allowed for GET requests', () => {
		expect(handleMcpGet()).toMatchObject({ statusCode: 405 });
	});
});
