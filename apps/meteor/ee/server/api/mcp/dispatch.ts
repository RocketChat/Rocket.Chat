import type { McpTool } from './catalog';
import type { McpAuth } from './server';

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

/**
 * Execute the REST endpoint a tool maps to, as the authenticated user.
 *
 * Dispatch is done via a loopback HTTP call to the local REST API, forwarding the
 * caller's PAT headers. This guarantees identical behaviour to a real REST client —
 * the same auth, permission checks, parameter validation and response shape — with
 * zero duplicated business logic. (An in-process Hono dispatch is a possible future
 * optimisation to avoid the loopback hop.)
 *
 * `clientIp` (resolved server-side from the MCP connection) is forwarded as `X-Real-IP`
 * so the REST per-route rate limiter keys on the real client rather than the loopback
 * address — otherwise every MCP caller would share a single `127.0.0.1` bucket.
 */
export const dispatchTool = async (
	tool: McpTool,
	args: Record<string, unknown>,
	auth: McpAuth,
	clientIp?: string,
	responseBudget?: McpResponseBudget,
): Promise<DispatchResult> => {
	const port = process.env.PORT || '3000';
	const runtimeConfig = (
		globalThis as typeof globalThis & {
			__meteor_runtime_config__?: { ROOT_URL_PATH_PREFIX?: string };
		}
	).__meteor_runtime_config__;
	const base = `http://127.0.0.1:${port}${runtimeConfig?.ROOT_URL_PATH_PREFIX ?? ''}`;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'X-User-Id': auth.userId,
		'X-Auth-Token': auth.authToken,
		...(clientIp && { 'X-Real-IP': clientIp }),
	};

	let url = base + tool.path;
	const init: RequestInit = {
		method: tool.method.toUpperCase(),
		headers,
		redirect: 'error',
		signal: AbortSignal.timeout(TOOL_CALL_TIMEOUT_MS),
	};

	if (tool.method === 'get' || tool.method === 'delete') {
		const qs = new URLSearchParams();
		for (const [key, value] of Object.entries(args ?? {})) {
			if (value === undefined) {
				continue;
			}
			qs.append(key, typeof value === 'string' ? value : JSON.stringify(value));
		}
		const query = qs.toString();
		if (query) {
			url += `?${query}`;
		}
	} else {
		init.body = JSON.stringify(args ?? {});
	}

	const res = await fetch(url, init);
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
