import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import type { MiddlewareHandler } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import { Accounts } from 'meteor/accounts-base';

import { createMcpResponseBudget } from './dispatch';
import { handleRpcMessage, isJsonRpcRequest, type JsonRpcResponse, type McpAuth } from './server';
import { isMcpOriginAllowed, isMcpProtocolVersionSupported, supportsMcpBatching } from './transport';
import { API } from '../../../../server/api';
import type { TypedOptions } from '../../../../server/api/definition';
import { authenticationMiddlewareForHono } from '../../../../server/api/v1/middlewares/authenticationHono';
import { permissionsMiddleware } from '../../../../server/api/v1/middlewares/permissions';
import { settings } from '../../../../server/settings/cached';
import { license } from '../v1/middlewares/license';

const logger = new Logger('MCP');

type McpHttpResponse = {
	statusCode: StatusCode;
	body: JsonRpcResponse | JsonRpcResponse[] | undefined;
	headers?: Record<string, string>;
};

const disabledResponse: McpHttpResponse = {
	statusCode: 404,
	body: { jsonrpc: '2.0', id: null, error: { code: -32601, message: 'MCP endpoint is disabled' } },
};

type McpActionContext = {
	bodyParams: unknown;
	bodyParseError?: boolean;
	userId: string;
	token: string;
	requestIp: string;
	request: Request;
};

const MAX_BATCH_SIZE = 20;
const MAX_BATCH_CONCURRENCY = 4;
const MAX_MCP_RESPONSE_BYTES = 5 * 1024 * 1024;
const MCP_ROUTE = 'mcp';
const MCP_RATE_LIMIT_OPTIONS = { numRequestsAllowed: 60, intervalTimeInMS: 60_000 };

const personalAccessTokenRequiredResponse: McpHttpResponse = {
	statusCode: 401,
	body: { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Personal Access Token required' } },
};

const invalidRequestResponse: McpHttpResponse = {
	statusCode: 400,
	body: { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } },
};

const parseErrorResponse: McpHttpResponse = {
	statusCode: 400,
	body: { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
};

const hasPersonalAccessToken = async ({ userId, token }: Pick<McpActionContext, 'userId' | 'token'>): Promise<boolean> =>
	Boolean(await Users.findPersonalAccessTokenByHashedTokenAndUserId({ userId, hashedToken: token }));

const jsonResponse = (body: JsonRpcResponse | JsonRpcResponse[]): McpHttpResponse => {
	if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_MCP_RESPONSE_BYTES) {
		return {
			statusCode: 413,
			body: { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'MCP response exceeds the 5 MiB limit' } },
		};
	}

	return { statusCode: 200, body };
};

const validateTransportRequest = (request: Request): McpHttpResponse | undefined => {
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

const handleBatch = async (messages: unknown[], auth: McpAuth, clientIp: string): Promise<(JsonRpcResponse | null)[]> => {
	const responseBudget = createMcpResponseBudget(MAX_MCP_RESPONSE_BYTES);
	const responses = new Array<JsonRpcResponse | null>(messages.length);
	let nextIndex = 0;

	const processNext = async (): Promise<void> => {
		while (nextIndex < messages.length) {
			const index = nextIndex++;
			responses[index] = await handleRpcMessage(messages[index], auth, clientIp, responseBudget);
		}
	};

	await Promise.all(Array.from({ length: Math.min(messages.length, MAX_BATCH_CONCURRENCY) }, () => processNext()));
	return responses;
};

export const handleMcpPost = async (context: McpActionContext): Promise<McpHttpResponse> => {
	if (!settings.get<boolean>('MCP_Enabled')) {
		return disabledResponse;
	}

	const transportError = validateTransportRequest(context.request);
	if (transportError) {
		return transportError;
	}
	if (!(await hasPersonalAccessToken(context))) {
		return personalAccessTokenRequiredResponse;
	}
	if (context.bodyParseError) {
		return parseErrorResponse;
	}

	const message = context.bodyParams;
	const auth: McpAuth = {
		userId: context.userId,
		authToken: String(context.request.headers.get('x-auth-token') ?? ''),
	};
	const clientIp = context.requestIp;

	if (Array.isArray(message)) {
		if (!supportsMcpBatching(context.request.headers.get('mcp-protocol-version'))) {
			return invalidRequestResponse;
		}

		if (message.length === 0 || message.length > MAX_BATCH_SIZE) {
			return invalidRequestResponse;
		}

		const responses = (await handleBatch(message, auth, clientIp)).filter((response): response is JsonRpcResponse => response !== null);
		return responses.length ? jsonResponse(responses) : { statusCode: 202, body: undefined };
	}

	if (!isJsonRpcRequest(message)) {
		return invalidRequestResponse;
	}

	const response = await handleRpcMessage(message, auth, clientIp);
	if (!response) {
		return { statusCode: 202, body: undefined };
	}

	return jsonResponse(response);
};

export const handleMcpGet = (context: Pick<McpActionContext, 'request'>): McpHttpResponse => {
	if (!settings.get<boolean>('MCP_Enabled')) {
		return disabledResponse;
	}

	const transportError = validateTransportRequest(context.request);
	if (transportError) {
		return transportError;
	}
	return {
		statusCode: 405,
		headers: { Allow: 'POST' },
		body: { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Only POST is supported' } },
	};
};

const routeOptions = {
	response: {},
	authRequired: true,
	permissionsRequired: {
		'*': { permissions: ['access-mcp'], operation: 'hasAll' },
	},
	license: [AI_LICENSE_MODULE],
} satisfies TypedOptions;

const sendResponse = (response: McpHttpResponse): Response => {
	const headers = { 'Content-Type': 'application/json', ...response.headers };
	return new Response(response.body === undefined ? null : JSON.stringify(response.body), { status: response.statusCode, headers });
};

const isRateLimitError = (error: unknown): error is { error: 'error-too-many-requests'; reason?: string } =>
	typeof error === 'object' && error !== null && 'error' in error && error.error === 'error-too-many-requests';

const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
	try {
		await API.v1.enforceRateLimitForRoute({
			route: MCP_ROUTE,
			method: c.req.method.toLowerCase(),
			request: c.req.raw,
			response: c.res,
			requestIp: c.get('remoteAddress'),
			userId: c.req.header('x-user-id'),
		});
	} catch (error) {
		if (!isRateLimitError(error)) {
			throw error;
		}

		return sendResponse({
			statusCode: 429,
			body: { jsonrpc: '2.0', id: null, error: { code: -32000, message: error.reason ?? 'Too many requests' } },
			headers: Object.fromEntries([...c.res.headers].filter(([name]) => name.toLowerCase().startsWith('x-ratelimit-'))),
		});
	}

	const rateLimitHeaders = [...c.res.headers].filter(([name]) => name.toLowerCase().startsWith('x-ratelimit-'));
	await next();
	for (const [name, value] of rateLimitHeaders) {
		c.res.headers.set(name, value);
	}
};

const router = API.v1.router.getHonoRouter();
API.v1.registerRateLimiterForRoute({ route: MCP_ROUTE, rateLimiterOptions: MCP_RATE_LIMIT_OPTIONS, methods: ['post'] });
router.use(
	'/mcp',
	authenticationMiddlewareForHono(API.v1, { authRequired: true, logger }),
	rateLimitMiddleware,
	permissionsMiddleware(routeOptions),
	license(routeOptions, License),
);
router.post('/mcp', async (c) => {
	const request = c.req.raw;
	const rawToken = request.headers.get('x-auth-token') ?? '';
	const userId = request.headers.get('x-user-id');

	if (!userId) {
		return sendResponse(personalAccessTokenRequiredResponse);
	}

	let bodyParams: unknown;
	let bodyParseError = false;

	try {
		bodyParams = await request.clone().json();
	} catch {
		bodyParseError = true;
	}

	return sendResponse(
		await handleMcpPost({
			bodyParams,
			bodyParseError,
			userId,
			token: Accounts._hashLoginToken(rawToken) ?? '',
			requestIp: c.get('remoteAddress'),
			request,
		}),
	);
});
router.get('/mcp', (c) => sendResponse(handleMcpGet({ request: c.req.raw })));
