import type { IUser } from '@rocket.chat/core-typings';

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
	user: { _id: 'user-id' } as IUser,
	userId: 'user-id',
	authToken: 'auth-token',
};

const tool = {
	name: 'chat_getMessage',
	description: 'Get a message',
	inputSchema: { type: 'object' },
	path: '/api/v1/chat.getMessage',
	method: 'get' as const,
};

describe('MCP JSON-RPC server', () => {
	beforeEach(() => {
		jest.mocked(settings.get).mockReturnValue(false);
		jest.mocked(getCuratedTools).mockReturnValue([tool]);
		jest.mocked(getExtendedTools).mockReturnValue([]);
		jest.mocked(dispatchTool).mockReset();
	});

	it('rejects malformed JSON-RPC messages without throwing', async () => {
		expect(isJsonRpcRequest({ jsonrpc: '2.0', method: 'ping' })).toBe(true);
		expect(isJsonRpcRequest({ jsonrpc: '1.0', method: 'ping' })).toBe(false);

		await expect(handleRpcMessage(null, auth)).resolves.toEqual({
			jsonrpc: '2.0',
			id: null,
			error: { code: -32600, message: 'Invalid Request' },
		});
	});

	it('returns server capabilities during initialization', async () => {
		await expect(
			handleRpcMessage({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, auth),
		).resolves.toEqual({
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
			handleRpcMessage({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: 'unsupported' } }, auth),
		).resolves.toMatchObject({ result: { protocolVersion: '2025-11-25' } });
	});

	it('lists the curated toolset by default', async () => {
		const response = await handleRpcMessage({ jsonrpc: '2.0', id: 3, method: 'tools/list' }, auth);

		expect(getCuratedTools).toHaveBeenCalledTimes(1);
		expect(getExtendedTools).not.toHaveBeenCalled();
		expect(response).toMatchObject({ result: { tools: [{ name: tool.name }] } });
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

		expect(dispatchTool).toHaveBeenCalledWith(tool, { msgId: 'message-id' }, auth, '192.0.2.1');
		expect(response).toEqual({
			jsonrpc: '2.0',
			id: 4,
			result: {
				content: [{ type: 'text', text: JSON.stringify({ message: { _id: 'message-id' } }) }],
				isError: false,
			},
		});
	});

	it('does not reply to notifications', async () => {
		await expect(handleRpcMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }, auth)).resolves.toBeNull();
		await expect(handleRpcMessage({ jsonrpc: '2.0', method: 'unknown/notification' }, auth)).resolves.toBeNull();
	});
});
