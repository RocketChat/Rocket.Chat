import { createMcpResponseBudget, dispatchTool } from './dispatch';
import type { McpAuth } from './server';
import { API } from '../../../../server/api';

jest.mock('../../../../server/api', () => ({
	API: { api: { dispatch: jest.fn() } },
}));

const dispatchMock = jest.mocked(API.api.dispatch);

const auth: McpAuth = {
	userId: 'user-id',
	authToken: 'auth-token',
};

describe('MCP tool dispatch', () => {
	afterEach(() => {
		dispatchMock.mockReset();
		jest.useRealTimers();
	});

	it('forwards GET arguments and caller identity to the REST router', async () => {
		dispatchMock.mockResolvedValue(new Response(JSON.stringify({ message: { _id: 'message-id' } }), { status: 200 }));

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

		const [request, env] = dispatchMock.mock.calls[0];
		expect(request.method).toBe('GET');
		expect(new URL(request.url).pathname + new URL(request.url).search).toBe(
			'/api/v1/chat.getMessage?msgId=message-id&fields=%7B%22msg%22%3A1%7D',
		);
		expect(request.headers.get('x-user-id')).toBe('user-id');
		expect(request.headers.get('x-auth-token')).toBe('auth-token');
		expect(request.headers.get('x-real-ip')).toBeNull();
		expect(env.incoming.socket.remoteAddress).toBe('192.0.2.1');
		expect(result).toEqual({ ok: true, status: 200, body: { message: { _id: 'message-id' } } });
	});

	it('sends POST arguments as a JSON body', async () => {
		dispatchMock.mockResolvedValue(new Response(null, { status: 200 }));

		await dispatchTool(
			{
				name: 'chat_postMessage',
				description: 'Post a message',
				inputSchema: { type: 'object' },
				path: '/api/v1/chat.postMessage',
				method: 'post',
			},
			{ roomId: 'room-id', text: 'Hello' },
			auth,
		);

		const [request] = dispatchMock.mock.calls[0];
		expect(request.method).toBe('POST');
		await expect(request.json()).resolves.toEqual({ roomId: 'room-id', text: 'Hello' });
	});

	it('fails tool calls that exceed the timeout', async () => {
		jest.useFakeTimers();
		dispatchMock.mockReturnValue(new Promise(() => undefined));

		const pending = dispatchTool(
			{
				name: 'rooms_get',
				description: 'Get rooms',
				inputSchema: { type: 'object' },
				path: '/api/v1/rooms.get',
				method: 'get',
			},
			{},
			auth,
		);
		jest.advanceTimersByTime(20_000);

		await expect(pending).rejects.toThrow('MCP tool call timed out after 20000 ms');
	});

	it('preserves non-JSON error responses', async () => {
		dispatchMock.mockResolvedValue(new Response('Service unavailable', { status: 503 }));

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
		dispatchMock.mockResolvedValue(new Response(null, { status: 204 }));

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
		dispatchMock.mockResolvedValue(
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
		dispatchMock.mockResolvedValue(new Response(new Uint8Array(5 * 1024 * 1024 + 1), { status: 200 }));

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
		dispatchMock.mockImplementation(async () => new Response('abc', { status: 200 }));
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
