import { dispatchTool } from './dispatch';
import type { McpAuth } from './server';

const auth: McpAuth = {
	userId: 'user-id',
	authToken: 'auth-token',
};

describe('MCP tool dispatch', () => {
	const originalPort = process.env.PORT;

	afterEach(() => {
		jest.restoreAllMocks();
		process.env.PORT = originalPort;
	});

	it('forwards GET arguments and caller identity to the local REST API', async () => {
		process.env.PORT = '3100';
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
			{ msgId: 'message-id', fields: { msg: 1 } },
			auth,
			'192.0.2.1',
		);

		expect(fetchMock).toHaveBeenCalledWith(
			'http://127.0.0.1:3100/api/v1/chat.getMessage?msgId=message-id&fields=%7B%22msg%22%3A1%7D',
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

	it('rejects responses that exceed the MCP result size limit', async () => {
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
});
