import { getCuratedTools, getExtendedTools } from './catalog';
import { dispatchTool } from './dispatch';
import { handleRpcMessage, isJsonRpcRequest, type McpAuth } from './server';
import { settings } from '../../../../server/settings/cached';

jest.mock('./catalog', () => ({
	getCuratedTools: jest.fn(),
	getExtendedTools: jest.fn(),
}));

jest.mock('./dispatch', () => ({
	dispatchTool: jest.fn(),
}));

jest.mock('../../../../server/api/lib/getTrimmedServerVersion', () => ({
	getTrimmedServerVersion: () => '9.0',
}));

jest.mock('../../../../server/settings/cached', () => ({
	settings: { get: jest.fn() },
}));

const auth: McpAuth = {
	userId: 'user-id',
	authToken: 'auth-token',
};

const tool = {
	name: 'get_chat_getMessage',
	description: 'Get a message',
	inputSchema: { type: 'object' },
	path: '/api/v1/chat.getMessage',
	method: 'get' as const,
};

const extendedTool = {
	...tool,
	name: 'get_chat_search',
	description: 'Search messages',
	path: '/api/v1/chat.search',
};

const initializeParams = {
	protocolVersion: '2025-06-18',
	capabilities: {},
	clientInfo: { name: 'test-client', version: '1.0.0' },
};

describe('MCP JSON-RPC server', () => {
	beforeEach(() => {
		jest.mocked(settings.get).mockReturnValue(false);
		jest.mocked(getCuratedTools).mockReset().mockReturnValue([tool]);
		jest.mocked(getExtendedTools).mockReset().mockReturnValue([]);
		jest.mocked(dispatchTool).mockReset();
	});

	it('rejects malformed JSON-RPC messages without throwing', async () => {
		expect(isJsonRpcRequest({ jsonrpc: '2.0', method: 'ping' })).toBe(true);
		expect(isJsonRpcRequest({ jsonrpc: '1.0', method: 'ping' })).toBe(false);
		expect(isJsonRpcRequest({ jsonrpc: '2.0', id: null, method: 'ping' })).toBe(false);

		await expect(handleRpcMessage(null, auth)).resolves.toEqual({
			jsonrpc: '2.0',
			id: null,
			error: { code: -32600, message: 'Invalid Request' },
		});
	});

	it('returns server capabilities during initialization', async () => {
		await expect(handleRpcMessage({ jsonrpc: '2.0', id: 1, method: 'initialize', params: initializeParams }, auth)).resolves.toEqual({
			jsonrpc: '2.0',
			id: 1,
			result: {
				protocolVersion: '2025-06-18',
				capabilities: { tools: { listChanged: false } },
				serverInfo: { name: 'rocketchat', version: '9.0' },
			},
		});
	});

	it('falls back to the latest supported version when negotiation fails', async () => {
		await expect(
			handleRpcMessage(
				{
					jsonrpc: '2.0',
					id: 2,
					method: 'initialize',
					params: { ...initializeParams, protocolVersion: 'unsupported' },
				},
				auth,
			),
		).resolves.toMatchObject({ result: { protocolVersion: '2025-11-25' } });
	});

	it('rejects initialize requests without the required client information', async () => {
		await expect(
			handleRpcMessage({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '2025-11-25' } }, auth),
		).resolves.toMatchObject({ error: { code: -32602, message: 'Invalid initialize parameters' } });
	});

	it('lists the curated toolset by default', async () => {
		const response = await handleRpcMessage({ jsonrpc: '2.0', id: 3, method: 'tools/list' }, auth);

		expect(getCuratedTools).toHaveBeenCalledTimes(1);
		expect(getExtendedTools).not.toHaveBeenCalled();
		expect(response).toMatchObject({ result: { tools: [{ name: tool.name }] } });
	});

	it('lists the extended toolset when enabled', async () => {
		jest.mocked(settings.get).mockReturnValue(true);
		jest.mocked(getExtendedTools).mockReturnValue([extendedTool]);

		const response = await handleRpcMessage({ jsonrpc: '2.0', id: 3, method: 'tools/list' }, auth);

		expect(getExtendedTools).toHaveBeenCalledTimes(1);
		expect(getCuratedTools).not.toHaveBeenCalled();
		expect(response).toMatchObject({ result: { tools: [{ name: extendedTool.name }] } });
	});

	it('validates tool call parameters before dispatch', async () => {
		await expect(
			handleRpcMessage({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: tool.name, arguments: [] } }, auth),
		).resolves.toMatchObject({ error: { code: -32602 } });
		expect(dispatchTool).not.toHaveBeenCalled();
	});

	it('dispatches a known tool as the authenticated user', async () => {
		jest.mocked(dispatchTool).mockResolvedValue({ ok: true, status: 200, body: { message: { _id: 'message-id' } } });

		const response = await handleRpcMessage(
			{ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: tool.name, arguments: { msgId: 'message-id' } } },
			auth,
			'192.0.2.1',
		);

		expect(dispatchTool).toHaveBeenCalledWith(tool, { msgId: 'message-id' }, auth, '192.0.2.1', undefined);
		expect(response).toEqual({
			jsonrpc: '2.0',
			id: 4,
			result: {
				content: [{ type: 'text', text: JSON.stringify({ message: { _id: 'message-id' } }) }],
				isError: false,
			},
		});
	});

	it('marks unsuccessful REST responses as tool errors', async () => {
		jest.mocked(dispatchTool).mockResolvedValue({ ok: false, status: 403, body: { error: 'Forbidden' } });

		await expect(
			handleRpcMessage({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: tool.name, arguments: {} } }, auth),
		).resolves.toMatchObject({ result: { isError: true, content: [{ text: JSON.stringify({ error: 'Forbidden' }) }] } });
	});

	it('returns thrown dispatch failures as tool errors', async () => {
		jest.mocked(dispatchTool).mockRejectedValue(new Error('Connection failed'));

		await expect(
			handleRpcMessage({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: tool.name, arguments: {} } }, auth),
		).resolves.toMatchObject({ result: { isError: true, content: [{ text: 'Tool execution failed: Connection failed' }] } });
	});

	it('rejects unknown tools without dispatching', async () => {
		await expect(
			handleRpcMessage({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'unknown', arguments: {} } }, auth),
		).resolves.toMatchObject({ error: { code: -32602, message: 'Unknown tool: unknown' } });
		expect(dispatchTool).not.toHaveBeenCalled();
	});

	it('does not reply to notifications', async () => {
		await expect(handleRpcMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }, auth)).resolves.toBeNull();
		await expect(handleRpcMessage({ jsonrpc: '2.0', method: 'unknown/notification' }, auth)).resolves.toBeNull();
	});
});
