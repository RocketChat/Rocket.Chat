import type { IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { handleRpcMessage, type JsonRpcRequest, type McpAuth } from './server';
import { API } from '../../../../../app/api/server';
import { settings } from '../../../../../app/settings/server';

const disabledResponse = {
	statusCode: 404,
	body: { jsonrpc: '2.0', id: null, error: { code: -32601, message: 'MCP endpoint is disabled' } },
};

type McpActionContext = {
	bodyParams: JsonRpcRequest | JsonRpcRequest[];
	userId: string;
	user: IUser;
	requestIp: string;
	request: Request;
};

const handleMcpPost = async function (this: McpActionContext) {
	if (!settings.get<boolean>('MCP_Enabled')) {
		return disabledResponse;
	}

	const message = this.bodyParams;
	const auth: McpAuth = {
		user: this.user,
		userId: this.userId,
		// The auth middleware already validated this token; forward the raw value so the
		// loopback dispatch authenticates as the same user.
		authToken: String(this.request.headers.get('x-auth-token') ?? ''),
	};
	const clientIp = this.requestIp;

	if (Array.isArray(message)) {
		const responses = (await Promise.all(message.map((m) => handleRpcMessage(m, auth, clientIp)))).filter(Boolean);
		return responses.length ? { statusCode: 200, body: responses } : { statusCode: 202, body: {} };
	}

	const response = await handleRpcMessage(message, auth, clientIp);
	if (!response) {
		// Notification — acknowledge without a body.
		return { statusCode: 202, body: {} };
	}

	// Per the Streamable-HTTP spec, a session id is assigned on `initialize` only.
	const headers = message.method === 'initialize' ? { 'Mcp-Session-Id': Random.id() } : undefined;
	return { statusCode: 200, body: response, ...(headers && { headers }) };
};

const handleMcpGet = () => {
	if (!settings.get<boolean>('MCP_Enabled')) {
		return disabledResponse;
	}
	// This minimal transport doesn't offer a server-initiated SSE stream (spec allows 405).
	return { statusCode: 405, body: { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Only POST is supported' } } };
};

/**
 * MCP Streamable-HTTP endpoint, mounted on the existing API router at `/api/v1/mcp`.
 * Registering it as a normal route means it reuses the whole REST middleware chain —
 * PAT authentication (`this.user`/`this.userId`), remote-address resolution
 * (`this.requestIp`), CORS, logging, metrics, and the built-in per-route rate limiter —
 * instead of re-implementing them. The JSON-RPC handling lives in `./server`.
 *
 * Gated behind the `experimental-enterprise-features` license module: requests are
 * rejected unless the workspace license includes it (the same gate also applies to the
 * `MCP_Enabled` setting).
 */
API.v1.addRoute('mcp', { authRequired: true, license: ['experimental-enterprise-features'] }, { post: handleMcpPost, get: handleMcpGet });
