import type { IUser } from '@rocket.chat/core-typings';

import { getCuratedTools, getExtendedTools, type McpTool } from './catalog';
import { dispatchTool } from './dispatch';
import { getTrimmedServerVersion } from '../../../../../app/api/server/lib/getTrimmedServerVersion';
import { settings } from '../../../../../app/settings/server';

export type McpAuth = {
	user: IUser;
	userId: string;
	/** The raw (unhashed) Personal Access Token, forwarded to the REST layer on dispatch. */
	authToken: string;
};

const DEFAULT_PROTOCOL_VERSION = '2024-11-05';

export type JsonRpcRequest = {
	jsonrpc: '2.0';
	id?: string | number | null;
	method: string;
	params?: Record<string, any>;
};

export type JsonRpcResponse = {
	jsonrpc: '2.0';
	id: string | number | null;
	result?: unknown;
	error?: { code: number; message: string; data?: unknown };
};

const result = (id: JsonRpcRequest['id'], value: unknown): JsonRpcResponse => ({ jsonrpc: '2.0', id: id ?? null, result: value });

const error = (id: JsonRpcRequest['id'], code: number, message: string, data?: unknown): JsonRpcResponse => ({
	jsonrpc: '2.0',
	id: id ?? null,
	error: { code, message, ...(data !== undefined && { data }) },
});

/** Build the tool list for this request, honouring the extended-toolset setting. */
const listTools = (): McpTool[] => {
	if (settings.get<boolean>('MCP_Expose_Extended_API')) {
		return getExtendedTools();
	}
	return getCuratedTools();
};

const toToolDefinition = ({ name, description, inputSchema }: McpTool) => ({ name, description, inputSchema });

/**
 * Handle a single JSON-RPC message. Returns the response object, or `null` for
 * notifications (which must not produce a response per the JSON-RPC spec).
 */
export const handleRpcMessage = async (message: JsonRpcRequest, auth: McpAuth, clientIp?: string): Promise<JsonRpcResponse | null> => {
	const { id, method, params } = message;

	switch (method) {
		case 'initialize':
			return result(id, {
				protocolVersion: params?.protocolVersion ?? DEFAULT_PROTOCOL_VERSION,
				capabilities: { tools: { listChanged: false } },
				serverInfo: {
					name: 'rocketchat',
					version: getTrimmedServerVersion(),
				},
			});

		// Notifications — no response.
		case 'notifications/initialized':
		case 'notifications/cancelled':
			return null;

		case 'ping':
			return result(id, {});

		case 'tools/list':
			return result(id, { tools: listTools().map(toToolDefinition) });

		case 'tools/call': {
			const name = params?.name;
			const tool = listTools().find((t) => t.name === name);

			if (!tool) {
				return error(id, -32602, `Unknown tool: ${name}`);
			}

			try {
				const dispatch = await dispatchTool(tool, params?.arguments ?? {}, auth, clientIp);
				return result(id, {
					content: [{ type: 'text', text: JSON.stringify(dispatch.body) }],
					isError: !dispatch.ok,
				});
			} catch (err) {
				return result(id, {
					content: [{ type: 'text', text: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` }],
					isError: true,
				});
			}
		}

		default:
			return error(id, -32601, `Method not found: ${method}`);
	}
};
