import { createMcpResponseBudget, dispatchTool } from './dispatch';
import type { McpAuth } from './server';

const auth: McpAuth = {
	userId: 'user-id',
	authToken: 'auth-token',
};

describe('MCP tool dispatch', () => {
	const originalPort = process.env.PORT;
	const runtimeGlobal = globalThis as typeof globalThis & { __meteor_runtime_config__?: { ROOT_URL_PATH_PREFIX?: string } };
	const originalRuntimeConfig = runtimeGlobal.__meteor_runtime_config__;

	afterEach(() => {
		jest.restoreAllMocks();
		if (originalPort === undefined) {
			delete process.env.PORT;
		} else {
			process.env.PORT = originalPort;
		}
		if (originalRuntimeConfig === undefined) {
			delete runtimeGlobal.__meteor_runtime_config__;
		} else {
			runtimeGlobal.__meteor_runtime_config__ = originalRuntimeConfig;
		}
	});

	it('forwards GET arguments and caller identity to the local REST API', async () => {
		process.env.PORT = '3100';
		runtimeGlobal.__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '/chat' };
		const fetchMock = jest
			.spyOn(global, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ message: { _id: 'message-id' } }), { status: 200 }));

		const result = await dispatchTool(
			{
				name: 'chat_getMessage',
				description: 'Get a message',
				inputSchema: { type: 'object' },
				path: '/api/v1/chat.getMessage',
				method: 'get',
			},
			{ msgId: 'message-id', fields: { msg: 1 }, optional: undefined },
			auth,
			'192.0.2.1',
		);

		expect(fetchMock).toHaveBeenCalledWith(
			'http://127.0.0.1:3100/chat/api/v1/chat.getMessage?msgId=message-id&fields=%7B%22msg%22%3A1%7D',
			expect.objectContaining({
				method: 'GET',
				redirect: 'error',
				headers: {
					'Content-Type': 'application/json',
					'X-User-Id': 'user-id',
					'X-Auth-Token': 'auth-token',
					'X-Real-IP': '192.0.2.1',
				},
				signal: expect.any(AbortSignal),
			}),
		);
		expect(result).toEqual({ ok: true, status: 200, body: { message: { _id: 'message-id' } } });
	});

	it('preserves non-JSON error responses', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue(new Response('Service unavailable', { status: 503 }));

		await expect(
			dispatchTool(
				{
					name: 'chat_postMessage',
					description: 'Post a message',
					inputSchema: { type: 'object' },
					path: '/api/v1/chat.postMessage',
					method: 'post',
				},
				{ roomId: 'room-id', text: 'Hello' },
				auth,
			),
		).resolves.toEqual({ ok: false, status: 503, body: 'Service unavailable' });
	});

	it('handles empty REST responses', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

		await expect(
			dispatchTool(
				{
					name: 'subscriptions_read',
					description: 'Mark a subscription as read',
					inputSchema: { type: 'object' },
					path: '/api/v1/subscriptions.read',
					method: 'post',
				},
				{ rid: 'room-id' },
				auth,
			),
		).resolves.toEqual({ ok: true, status: 204, body: '' });
	});

	it('rejects responses whose content length exceeds the MCP result size limit', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue(
			new Response(null, {
				status: 200,
				headers: { 'content-length': String(5 * 1024 * 1024 + 1) },
			}),
		);

		await expect(
			dispatchTool(
				{
					name: 'rooms_get',
					description: 'Get rooms',
					inputSchema: { type: 'object' },
					path: '/api/v1/rooms.get',
					method: 'get',
				},
				{},
				auth,
			),
		).rejects.toThrow('MCP tool response exceeds the 5 MiB limit');
	});

	it('stops streaming responses that exceed the MCP result size limit', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array(5 * 1024 * 1024 + 1), { status: 200 }));

		await expect(
			dispatchTool(
				{
					name: 'rooms_get',
					description: 'Get rooms',
					inputSchema: { type: 'object' },
					path: '/api/v1/rooms.get',
					method: 'get',
				},
				{},
				auth,
			),
		).rejects.toThrow('MCP tool response exceeds the 5 MiB limit');
	});

	it('shares the response size budget across batched tool calls', async () => {
		jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('abc', { status: 200 }));
		const responseBudget = createMcpResponseBudget(5);
		const tool = {
			name: 'rooms_get',
			description: 'Get rooms',
			inputSchema: { type: 'object' },
			path: '/api/v1/rooms.get',
			method: 'get' as const,
		};

		await expect(dispatchTool(tool, {}, auth, undefined, responseBudget)).resolves.toMatchObject({ body: 'abc' });
		await expect(dispatchTool(tool, {}, auth, undefined, responseBudget)).rejects.toThrow('MCP batch response exceeds the 5 bytes limit');
	});
});
