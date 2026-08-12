import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

import { handleMcpGet, handleMcpPost } from './index';
import { handleRpcMessage } from './server';
import { API } from '../../../../server/api';
import { authenticationMiddlewareForHono } from '../../../../server/api/v1/middlewares/authenticationHono';
import { permissionsMiddleware } from '../../../../server/api/v1/middlewares/permissions';
import { settings } from '../../../../server/settings/cached';
import { license } from '../v1/middlewares/license';

jest.mock('meteor/accounts-base', () => ({ Accounts: { _hashLoginToken: jest.fn((token: string) => `hashed-${token}`) } }), {
	virtual: true,
});

jest.mock('@rocket.chat/models', () => ({
	Users: { findPersonalAccessTokenByHashedTokenAndUserId: jest.fn() },
}));

jest.mock('./server', () => ({
	handleRpcMessage: jest.fn(),
}));

jest.mock('../../../../server/api', () => ({
	API: {
		v1: {
			router: {
				getHonoRouter: jest.fn(() => ({ use: jest.fn(), post: jest.fn(), get: jest.fn() })),
			},
		},
	},
}));

jest.mock('../../../../server/api/v1/middlewares/authenticationHono', () => ({
	authenticationMiddlewareForHono: jest.fn(() => jest.fn()),
}));

jest.mock('../../../../server/api/v1/middlewares/permissions', () => ({
	permissionsMiddleware: jest.fn(() => jest.fn()),
}));

jest.mock('../v1/middlewares/license', () => ({
	license: jest.fn(() => jest.fn()),
}));

jest.mock('../../../../server/settings/cached', () => ({
	settings: { get: jest.fn() },
}));

const mockRouter = jest.mocked(API.v1.router.getHonoRouter).mock.results[0]?.value;

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
			.mocked(Users.findPersonalAccessTokenByHashedTokenAndUserId)
			.mockReset()
			.mockResolvedValue({ _id: 'user-id' } as never);
	});

	it('registers the endpoint with authentication, permission, and license gates', () => {
		expect(API.v1.router.getHonoRouter).toHaveBeenCalledTimes(1);
		expect(authenticationMiddlewareForHono).toHaveBeenCalledWith(API.v1, expect.objectContaining({ authRequired: true }));
		expect(permissionsMiddleware).toHaveBeenCalledWith(expect.objectContaining({ permissionsRequired: ['access-mcp'] }));
		expect(license).toHaveBeenCalledWith(expect.objectContaining({ license: [AI_LICENSE_MODULE] }), expect.anything());
		expect(mockRouter.use).toHaveBeenCalledWith('/mcp', expect.any(Function), expect.any(Function), expect.any(Function));
		expect(mockRouter.post).toHaveBeenCalledWith('/mcp', expect.any(Function));
		expect(mockRouter.get).toHaveBeenCalledWith('/mcp', expect.any(Function));
	});

	it('adapts Hono POST requests to exact JSON-RPC responses', async () => {
		const response = { jsonrpc: '2.0' as const, id: 7, result: {} };
		jest.mocked(handleRpcMessage).mockResolvedValue(response);
		const request = new Request('http://localhost/api/v1/mcp', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'x-auth-token': 'auth-token', 'x-user-id': 'user-id' },
			body: JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'ping' }),
		});
		const handler = mockRouter.post.mock.calls[0]?.[1];
		expect(handler).toBeDefined();
		if (!handler) {
			throw new Error('MCP POST handler was not registered');
		}

		const result = await handler({
			req: { raw: request },
			get: (key: string) => (key === 'user' ? { _id: 'user-id' } : '192.0.2.1'),
		});

		expect(result).toBeInstanceOf(Response);
		expect(result.status).toBe(200);
		await expect(result.json()).resolves.toEqual(response);
		expect(Accounts._hashLoginToken).toHaveBeenCalledWith('auth-token');
		expect(Users.findPersonalAccessTokenByHashedTokenAndUserId).toHaveBeenCalledWith({
			userId: 'user-id',
			hashedToken: 'hashed-auth-token',
		});
	});

	it('returns not found while MCP is disabled', async () => {
		jest.mocked(settings.get).mockReturnValue(false);

		await expect(handleMcpPost(context)).resolves.toMatchObject({ statusCode: 404 });
		expect(handleMcpGet(context)).toMatchObject({ statusCode: 404 });
	});

	it('rejects empty and oversized JSON-RPC batches', async () => {
		await expect(handleMcpPost({ ...context, bodyParams: [] })).resolves.toMatchObject({
			statusCode: 400,
			body: { error: { code: -32600 } },
		});
		await expect(handleMcpPost({ ...context, bodyParams: Array.from({ length: 21 }, () => context.bodyParams) })).resolves.toMatchObject({
			statusCode: 400,
			body: { error: { code: -32600 } },
		});
		expect(handleRpcMessage).not.toHaveBeenCalled();
	});

	it('acknowledges notifications without a response body', async () => {
		jest.mocked(handleRpcMessage).mockResolvedValue(null);

		await expect(handleMcpPost(context)).resolves.toEqual({ statusCode: 202, body: undefined });
		await expect(handleMcpPost({ ...context, bodyParams: [context.bodyParams] })).resolves.toEqual({
			statusCode: 202,
			body: undefined,
		});
	});

	it('omits notification entries from batch responses', async () => {
		const response = { jsonrpc: '2.0' as const, id: 1, result: {} };
		jest.mocked(handleRpcMessage).mockResolvedValueOnce(response).mockResolvedValueOnce(null);

		await expect(handleMcpPost({ ...context, bodyParams: [context.bodyParams, context.bodyParams] })).resolves.toEqual({
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

		const response = await handleMcpPost({ ...context, bodyParams });

		expect(maxInFlight).toBe(4);
		expect(response.body).toEqual(bodyParams.map(({ id }) => ({ jsonrpc: '2.0', id, result: {} })));
	});

	it('returns method not allowed for GET requests', () => {
		expect(handleMcpGet(context)).toMatchObject({ statusCode: 405, headers: { Allow: 'POST' } });
		expect(Users.findPersonalAccessTokenByHashedTokenAndUserId).not.toHaveBeenCalled();
	});

	it('rejects authenticated sessions that are not personal access tokens', async () => {
		jest.mocked(Users.findPersonalAccessTokenByHashedTokenAndUserId).mockResolvedValue(null);

		await expect(handleMcpPost(context)).resolves.toMatchObject({
			statusCode: 401,
			body: { error: { message: 'Personal Access Token required' } },
		});
		expect(handleRpcMessage).not.toHaveBeenCalled();
	});

	it('rejects final encoded responses that exceed the MCP response limit', async () => {
		jest.mocked(handleRpcMessage).mockResolvedValue({ jsonrpc: '2.0', id: 1, result: 'x'.repeat(5 * 1024 * 1024) });

		await expect(handleMcpPost(context)).resolves.toMatchObject({
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
			handleMcpPost({
				...context,
				request: new Request('https://chat.example.com/api/v1/mcp', {
					headers: { 'origin': 'https://attacker.example', 'x-auth-token': 'auth-token' },
				}),
			}),
		).resolves.toMatchObject({ statusCode: 403 });
		expect(handleRpcMessage).not.toHaveBeenCalled();
		expect(
			handleMcpGet({
				request: new Request('https://chat.example.com/api/v1/mcp', { headers: { origin: 'https://attacker.example' } }),
			}),
		).toMatchObject({ statusCode: 403 });
	});

	it('rejects unsupported protocol-version headers', async () => {
		await expect(
			handleMcpPost({
				...context,
				request: new Request('http://localhost/api/v1/mcp', {
					headers: { 'mcp-protocol-version': '2099-01-01', 'x-auth-token': 'auth-token' },
				}),
			}),
		).resolves.toMatchObject({ statusCode: 400 });
		expect(handleRpcMessage).not.toHaveBeenCalled();
	});
});
