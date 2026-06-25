import type { McpTool } from './catalog';
import type { McpAuth } from './server';

export type DispatchResult = {
	ok: boolean;
	status: number;
	body: unknown;
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
): Promise<DispatchResult> => {
	const port = process.env.PORT || '3000';
	const base = `http://127.0.0.1:${port}`;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'X-User-Id': auth.userId,
		'X-Auth-Token': auth.authToken,
		...(clientIp && { 'X-Real-IP': clientIp }),
	};

	let url = base + tool.path;
	const init: RequestInit = { method: tool.method.toUpperCase(), headers };

	if (tool.method === 'get' || tool.method === 'delete') {
		const qs = new URLSearchParams();
		for (const [key, value] of Object.entries(args ?? {})) {
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
	const body = await res.json().catch(() => ({}));

	return { ok: res.ok, status: res.status, body };
};
