import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { Users } from '@rocket.chat/models';

import { handleMcpGet, handleMcpPost } from './index';
import { handleRpcMessage } from './server';
import { API } from '../../../../server/api';
import { settings } from '../../../../server/settings/cached';

jest.mock('./permissions', () => ({}));

jest.mock('@rocket.chat/models', () => ({
	Users: { findOne: jest.fn() },
}));

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
	token: 'hashed-auth-token',
	requestIp: '192.0.2.1',
	request: new Request('http://localhost/api/v1/mcp', { headers: { 'x-auth-token': 'auth-token' } }),
};

describe('MCP HTTP route', () => {
	beforeEach(() => {
		jest.mocked(settings.get).mockReturnValue(true);
		jest.mocked(handleRpcMessage).mockReset();
		jest
			.mocked(Users.findOne)
			.mockReset()
			.mockResolvedValue({ _id: 'user-id' } as never);
	});

	it('registers the endpoint with authentication, permission, and license gates', () => {
		expect(API.v1.addRoute).toHaveBeenCalledWith(
			'mcp',
			{ authRequired: true, permissionsRequired: ['access-mcp'], license: [AI_LICENSE_MODULE] },
			{ post: handleMcpPost, get: handleMcpGet },
		);
	});

	it('returns not found while MCP is disabled', async () => {
		jest.mocked(settings.get).mockReturnValue(false);

		await expect(handleMcpPost.call(context)).resolves.toMatchObject({ statusCode: 404 });
		expect(handleMcpGet.call(context)).toMatchObject({ statusCode: 404 });
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

		await expect(handleMcpPost.call(context)).resolves.toEqual({ statusCode: 202, body: undefined });
		await expect(handleMcpPost.call({ ...context, bodyParams: [context.bodyParams] })).resolves.toEqual({
			statusCode: 202,
			body: undefined,
		});
	});

	it('omits notification entries from batch responses', async () => {
		const response = { jsonrpc: '2.0' as const, id: 1, result: {} };
		jest.mocked(handleRpcMessage).mockResolvedValueOnce(response).mockResolvedValueOnce(null);

		await expect(handleMcpPost.call({ ...context, bodyParams: [context.bodyParams, context.bodyParams] })).resolves.toEqual({
			statusCode: 200,
			body: [response],
		});
		const [firstCall, secondCall] = jest.mocked(handleRpcMessage).mock.calls;
		expect(firstCall?.[3]).toBeDefined();
		expect(firstCall?.[3]).toBe(secondCall?.[3]);
	});

	it('limits concurrent calls while preserving batch response order', async () => {
		let inFlight = 0;
		let maxInFlight = 0;
		jest.mocked(handleRpcMessage).mockImplementation(async (message) => {
			inFlight += 1;
			maxInFlight = Math.max(maxInFlight, inFlight);
			await Promise.resolve();
			inFlight -= 1;
			if (typeof message !== 'object' || message === null || !('id' in message) || typeof message.id !== 'number') {
				throw new Error('Expected a numbered JSON-RPC request');
			}
			return { jsonrpc: '2.0', id: message.id, result: {} };
		});
		const bodyParams = Array.from({ length: 20 }, (_, id) => ({ jsonrpc: '2.0', id, method: 'ping' }));

		const response = await handleMcpPost.call({ ...context, bodyParams });

		expect(maxInFlight).toBe(4);
		expect(response.body).toEqual(bodyParams.map(({ id }) => ({ jsonrpc: '2.0', id, result: {} })));
	});

	it('returns method not allowed for GET requests', () => {
		expect(handleMcpGet.call(context)).toMatchObject({ statusCode: 405, headers: { Allow: 'POST' } });
		expect(Users.findOne).not.toHaveBeenCalled();
	});

	it('rejects authenticated sessions that are not personal access tokens', async () => {
		jest.mocked(Users.findOne).mockResolvedValue(null);

		await expect(handleMcpPost.call(context)).resolves.toMatchObject({
			statusCode: 401,
			body: { error: { message: 'Personal Access Token required' } },
		});
		expect(handleRpcMessage).not.toHaveBeenCalled();
	});

	it('rejects final encoded responses that exceed the MCP response limit', async () => {
		jest.mocked(handleRpcMessage).mockResolvedValue({ jsonrpc: '2.0', id: 1, result: 'x'.repeat(5 * 1024 * 1024) });

		await expect(handleMcpPost.call(context)).resolves.toMatchObject({
			statusCode: 413,
			body: { error: { message: 'MCP response exceeds the 5 MiB limit' } },
		});
	});

	it('rejects browser requests from untrusted origins', async () => {
		jest.mocked(settings.get).mockImplementation((setting) => {
			if (setting === 'MCP_Enabled') {
				return true;
			}
			if (setting === 'Site_Url') {
				return 'https://chat.example.com';
			}
			return false;
		});

		await expect(
			handleMcpPost.call({
				...context,
				request: new Request('https://chat.example.com/api/v1/mcp', {
					headers: { 'origin': 'https://attacker.example', 'x-auth-token': 'auth-token' },
				}),
			}),
		).resolves.toMatchObject({ statusCode: 403 });
		expect(handleRpcMessage).not.toHaveBeenCalled();
		expect(
			handleMcpGet.call({
				request: new Request('https://chat.example.com/api/v1/mcp', { headers: { origin: 'https://attacker.example' } }),
			}),
		).toMatchObject({ statusCode: 403 });
	});

	it('rejects unsupported protocol-version headers', async () => {
		await expect(
			handleMcpPost.call({
				...context,
				request: new Request('http://localhost/api/v1/mcp', {
					headers: { 'mcp-protocol-version': '2099-01-01', 'x-auth-token': 'auth-token' },
				}),
			}),
		).resolves.toMatchObject({ statusCode: 400 });
		expect(handleRpcMessage).not.toHaveBeenCalled();
	});
});
