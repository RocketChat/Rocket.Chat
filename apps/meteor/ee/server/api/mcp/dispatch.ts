import type { IncomingMessage } from 'node:http';

import type { McpTool } from './catalog';
import type { McpAuth } from './server';
import { API } from '../../../../server/api';

export type DispatchResult = {
	ok: boolean;
	status: number;
	body: unknown;
};

export type McpResponseBudget = {
	consume: (bytes: number) => void;
};

const TOOL_CALL_TIMEOUT_MS = 20_000;
const MAX_TOOL_RESPONSE_BYTES = 5 * 1024 * 1024;
const BYTES_PER_MEBIBYTE = 1024 * 1024;

const formatByteLimit = (bytes: number): string =>
	bytes % BYTES_PER_MEBIBYTE === 0 ? `${bytes / BYTES_PER_MEBIBYTE} MiB` : `${bytes} bytes`;

export const createMcpResponseBudget = (maxBytes = MAX_TOOL_RESPONSE_BYTES): McpResponseBudget => {
	let remainingBytes = maxBytes;
	const formattedLimit = formatByteLimit(maxBytes);

	return {
		consume(bytes) {
			if (bytes > remainingBytes) {
				throw new Error(`MCP batch response exceeds the ${formattedLimit} limit`);
			}

			remainingBytes -= bytes;
		},
	};
};

const readResponseText = async (response: Response, responseBudget?: McpResponseBudget): Promise<string> => {
	const contentLength = Number(response.headers.get('content-length'));
	if (Number.isFinite(contentLength) && contentLength > MAX_TOOL_RESPONSE_BYTES) {
		throw new Error('MCP tool response exceeds the 5 MiB limit');
	}

	if (!response.body) {
		return '';
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const chunks: string[] = [];
	let receivedBytes = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}

		receivedBytes += value.byteLength;
		if (receivedBytes > MAX_TOOL_RESPONSE_BYTES) {
			await reader.cancel();
			throw new Error('MCP tool response exceeds the 5 MiB limit');
		}

		try {
			responseBudget?.consume(value.byteLength);
		} catch (error) {
			await reader.cancel();
			throw error;
		}
		chunks.push(decoder.decode(value, { stream: true }));
	}

	chunks.push(decoder.decode());
	return chunks.join('');
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(`MCP tool call timed out after ${timeoutMs} ms`)), timeoutMs);
	});

	try {
		return await Promise.race([promise, timeout]);
	} finally {
		clearTimeout(timer);
	}
};

/**
 * Execute the REST endpoint a tool maps to, as the authenticated user.
 *
 * The call goes through the same HTTP router a real REST client reaches, so the auth,
 * permission checks, parameter validation, rate limit and response shape are identical,
 * with zero duplicated business logic.
 *
 * `clientIp` (resolved server-side from the MCP connection) becomes the address of the
 * synthetic request, so the REST per-route rate limiter keys on the real client.
 */
export const dispatchTool = async (
	tool: McpTool,
	args: Record<string, unknown>,
	auth: McpAuth,
	clientIp?: string,
	responseBudget?: McpResponseBudget,
): Promise<DispatchResult> => {
	const url = new URL(tool.path, 'http://localhost');
	const init: RequestInit = {
		method: tool.method.toUpperCase(),
		headers: {
			'Content-Type': 'application/json',
			'X-User-Id': auth.userId,
			'X-Auth-Token': auth.authToken,
		},
	};

	if (tool.method === 'get' || tool.method === 'delete') {
		for (const [key, value] of Object.entries(args ?? {})) {
			if (value === undefined) {
				continue;
			}
			url.searchParams.append(key, typeof value === 'string' ? value : JSON.stringify(value));
		}
	} else {
		init.body = JSON.stringify(args ?? {});
	}

	const incoming = { socket: { remoteAddress: clientIp }, connection: { remoteAddress: clientIp } } as unknown as IncomingMessage;

	const res = await withTimeout(API.api.dispatch(new Request(url, init), { incoming }), TOOL_CALL_TIMEOUT_MS);
	const responseText = await readResponseText(res, responseBudget);
	let body: unknown = responseText;
	if (responseText) {
		try {
			body = JSON.parse(responseText);
		} catch {
			// Keep non-JSON REST responses as text so callers receive the actual result.
		}
	}

	return { ok: res.ok, status: res.status, body };
};
