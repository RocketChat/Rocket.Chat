import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { Users } from '@rocket.chat/models';

import './permissions';
import { handleRpcMessage, type JsonRpcResponse, type McpAuth } from './server';
import { isMcpOriginAllowed, isMcpProtocolVersionSupported } from './transport';
import { API } from '../../../../server/api';
import { settings } from '../../../../server/settings/cached';

const disabledResponse = {
	statusCode: 404,
	body: { jsonrpc: '2.0', id: null, error: { code: -32601, message: 'MCP endpoint is disabled' } },
};

type McpActionContext = {
	bodyParams: unknown;
	userId: string;
	token: string;
	requestIp: string;
	request: Request;
};

const MAX_BATCH_SIZE = 20;
const MAX_MCP_RESPONSE_BYTES = 5 * 1024 * 1024;

const personalAccessTokenRequiredResponse = {
	statusCode: 401,
	body: { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Personal Access Token required' } },
};

const hasPersonalAccessToken = async ({ userId, token }: Pick<McpActionContext, 'userId' | 'token'>): Promise<boolean> =>
	Boolean(
		await Users.findOne(
			{
				'_id': userId,
				'services.resume.loginTokens': { $elemMatch: { hashedToken: token, type: 'personalAccessToken' } },
			},
			{ projection: { _id: 1 } },
		),
	);

const jsonResponse = (body: JsonRpcResponse | JsonRpcResponse[]) => {
	if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_MCP_RESPONSE_BYTES) {
		return {
			statusCode: 413,
			body: { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'MCP response exceeds the 5 MiB limit' } },
		};
	}

	return { statusCode: 200, body };
};

const validateTransportRequest = (request: Request) => {
	if (!isMcpOriginAllowed(request.headers.get('origin'))) {
		return {
			statusCode: 403,
			body: { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Origin is not allowed' } },
		};
	}
	if (!isMcpProtocolVersionSupported(request.headers.get('mcp-protocol-version'))) {
		return {
			statusCode: 400,
			body: { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Unsupported MCP protocol version' } },
		};
	}
	return undefined;
};

export const handleMcpPost = async function (this: McpActionContext) {
	if (!settings.get<boolean>('MCP_Enabled')) {
		return disabledResponse;
	}

	const transportError = validateTransportRequest(this.request);
	if (transportError) {
		return transportError;
	}
	if (!(await hasPersonalAccessToken(this))) {
		return personalAccessTokenRequiredResponse;
	}

	const message = this.bodyParams;
	const auth: McpAuth = {
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
		return responses.length ? jsonResponse(responses) : { statusCode: 202, body: undefined };
	}

	const response = await handleRpcMessage(message, auth, clientIp);
	if (!response) {
		// Notification — acknowledge without a body.
		return { statusCode: 202, body: undefined };
	}

	return jsonResponse(response);
};

export const handleMcpGet = async function (this: Pick<McpActionContext, 'request' | 'token' | 'userId'>) {
	if (!settings.get<boolean>('MCP_Enabled')) {
		return disabledResponse;
	}

	const transportError = validateTransportRequest(this.request);
	if (transportError) {
		return transportError;
	}
	if (!(await hasPersonalAccessToken(this))) {
		return personalAccessTokenRequiredResponse;
	}

	// This minimal transport doesn't offer a server-initiated SSE stream (spec allows 405).
	return {
		statusCode: 405,
		headers: { Allow: 'POST' },
		body: { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Only POST is supported' } },
	};
};

/**
 * MCP Streamable-HTTP endpoint, mounted on the existing API router at `/api/v1/mcp`.
 * Registering it as a normal route means it reuses the whole REST middleware chain —
 * PAT authentication (`this.user`/`this.userId`), remote-address resolution
 * (`this.requestIp`), logging, metrics, and the built-in per-route rate limiter —
 * instead of re-implementing them. The JSON-RPC handling lives in `./server`.
 * Browser origins are validated here because the MCP transport requires stricter
 * DNS-rebinding protection than the shared REST CORS middleware provides.
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
