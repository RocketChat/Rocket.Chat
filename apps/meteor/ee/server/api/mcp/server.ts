import { getCuratedTools, getExtendedTools, type McpTool } from './catalog';
import { dispatchTool, type McpResponseBudget } from './dispatch';
import { SUPPORTED_PROTOCOL_VERSIONS } from './transport';
import { getTrimmedServerVersion } from '../../../../server/api/lib/getTrimmedServerVersion';
import { settings } from '../../../../server/settings/cached';

export type McpAuth = {
	userId: string;
	/** The raw (unhashed) Personal Access Token, forwarded to the REST layer on dispatch. */
	authToken: string;
};

const DEFAULT_PROTOCOL_VERSION = '2025-11-25';

const negotiateProtocolVersion = (requestedVersion: unknown): string =>
	typeof requestedVersion === 'string' && SUPPORTED_PROTOCOL_VERSIONS.has(requestedVersion) ? requestedVersion : DEFAULT_PROTOCOL_VERSION;

export type JsonRpcRequest = {
	jsonrpc: '2.0';
	id?: string | number;
	method: string;
	params?: Record<string, unknown>;
};

export type JsonRpcResponse = {
	jsonrpc: '2.0';
	id: string | number | null;
	result?: unknown;
	error?: { code: number; message: string; data?: unknown };
};

const result = (id: JsonRpcRequest['id'], value: unknown): JsonRpcResponse => ({ jsonrpc: '2.0', id: id ?? null, result: value });

const error = (id: JsonRpcResponse['id'] | undefined, code: number, message: string, data?: unknown): JsonRpcResponse => ({
	jsonrpc: '2.0',
	id: id ?? null,
	error: { code, message, ...(data !== undefined && { data }) },
});

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isInitializeParams = (params: unknown): params is Record<string, unknown> => {
	if (!isRecord(params) || typeof params.protocolVersion !== 'string' || !isRecord(params.capabilities) || !isRecord(params.clientInfo)) {
		return false;
	}

	return typeof params.clientInfo.name === 'string' && typeof params.clientInfo.version === 'string';
};

export const isJsonRpcRequest = (value: unknown): value is JsonRpcRequest => {
	if (!isRecord(value) || value.jsonrpc !== '2.0' || typeof value.method !== 'string' || value.method.length === 0) {
		return false;
	}

	if (value.id !== undefined && typeof value.id !== 'string' && typeof value.id !== 'number') {
		return false;
	}

	return value.params === undefined || isRecord(value.params);
};

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
export const handleRpcMessage = async (
	message: unknown,
	auth: McpAuth,
	clientIp?: string,
	responseBudget?: McpResponseBudget,
): Promise<JsonRpcResponse | null> => {
	if (!isJsonRpcRequest(message)) {
		return error(null, -32600, 'Invalid Request');
	}

	const { id, method, params } = message;
	const respond = (response: JsonRpcResponse): JsonRpcResponse | null => (id === undefined ? null : response);

	switch (method) {
		case 'initialize': {
			if (!isInitializeParams(params)) {
				return respond(error(id, -32602, 'Invalid initialize parameters'));
			}

			return respond(
				result(id, {
					protocolVersion: negotiateProtocolVersion(params.protocolVersion),
					capabilities: { tools: { listChanged: false } },
					serverInfo: {
						name: 'rocketchat',
						version: getTrimmedServerVersion(),
					},
				}),
			);
		}

		case 'notifications/initialized':
		case 'notifications/cancelled':
			return null;

		case 'ping':
			return respond(result(id, {}));

		case 'tools/list':
			return respond(result(id, { tools: listTools().map(toToolDefinition) }));

		case 'tools/call': {
			const name = params?.name;
			const args = params?.arguments;
			if (typeof name !== 'string' || (args !== undefined && !isRecord(args))) {
				return respond(error(id, -32602, 'Invalid tools/call parameters'));
			}

			const tool = listTools().find((t) => t.name === name);

			if (!tool) {
				return respond(error(id, -32602, `Unknown tool: ${name}`));
			}

			try {
				const dispatch = await dispatchTool(tool, args ?? {}, auth, clientIp, responseBudget);
				return respond(
					result(id, {
						content: [{ type: 'text', text: JSON.stringify(dispatch.body) }],
						isError: !dispatch.ok,
					}),
				);
			} catch (err) {
				return respond(
					result(id, {
						content: [{ type: 'text', text: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` }],
						isError: true,
					}),
				);
			}
		}

		default:
			return respond(error(id, -32601, `Method not found: ${method}`));
	}
};
