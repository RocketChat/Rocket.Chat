import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import type { IUser } from '@rocket.chat/core-typings';

import './permissions';
import { handleRpcMessage, type JsonRpcResponse, type McpAuth } from './server';
import { API } from '../../../../server/api';
import { settings } from '../../../../server/settings/cached';

const disabledResponse = {
	statusCode: 404,
	body: { jsonrpc: '2.0', id: null, error: { code: -32601, message: 'MCP endpoint is disabled' } },
};

type McpActionContext = {
	bodyParams: unknown;
	userId: string;
	user: IUser;
	requestIp: string;
	request: Request;
};

const MAX_BATCH_SIZE = 20;

export const handleMcpPost = async function (this: McpActionContext) {
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
		if (message.length === 0 || message.length > MAX_BATCH_SIZE) {
			return {
				statusCode: 400,
				body: { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } },
			};
		}

		const responses = (await Promise.all(message.map((m) => handleRpcMessage(m, auth, clientIp)))).filter(
			(response): response is JsonRpcResponse => response !== null,
		);
		return responses.length ? { statusCode: 200, body: responses } : { statusCode: 202, body: {} };
	}

	const response = await handleRpcMessage(message, auth, clientIp);
	if (!response) {
		// Notification — acknowledge without a body.
		return { statusCode: 202, body: {} };
	}

	return { statusCode: 200, body: response };
};

export const handleMcpGet = () => {
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
 * Gated behind the Rocket.Chat AI add-on: requests are
 * rejected unless the workspace license includes it (the same gate also applies to the
 * `MCP_Enabled` setting). Every action additionally requires the `access-mcp` permission.
 */
API.v1.addRoute(
	'mcp',
	{ authRequired: true, permissionsRequired: ['access-mcp'], license: [AI_LICENSE_MODULE] },
	{ post: handleMcpPost, get: handleMcpGet },
);
