/**
 * App-provided HTTP endpoints (webhooks, callbacks).
 *
 * Legacy: `IApiExtend.provideApi({ endpoints: [{ path, get/post(request, endpoint,
 * read, modify, http, persis) }] })` with an untyped `request.content`.
 *
 * The SDK mirrors Mastra's `registerApiRoute(path, { method, handler })` but adds
 * schema validation for `body`/`query`/`params` and the unified `ctx`. Endpoints
 * are still exposed at the stable, per-app URL space
 * `/api/apps/public/{appId}/{path}` (public) or `/api/apps/private/{appId}/{hash}/{path}`
 * (private) — unchanged, so existing integrations keep working.
 */

import type { AppContext, AppEnv, BaseEnv } from './context';
import type { UserId } from './models';
import type { InferArg, Schema } from './schema';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface EndpointResponse {
	status: number;
	headers?: Record<string, string>;
	body?: unknown;
}

export interface EndpointContext<Env extends AppEnv, TBody, TQuery, TParams> extends AppContext<Env> {
	readonly req: {
		readonly method: HttpMethod;
		readonly url: string;
		readonly headers: Record<string, string>;
		readonly rawBody: () => Promise<string>;
	};
	/** Validated request body (typed by `bodySchema`). */
	readonly body: TBody;
	/** Validated query string (typed by `querySchema`). */
	readonly query: TQuery;
	/** Validated path params (typed by `paramsSchema`). */
	readonly params: TParams;
	/** The authenticated user, present only when `auth: 'user'`. */
	readonly actor?: { readonly id: UserId };
	json(data: unknown, status?: number): EndpointResponse;
	text(data: string, status?: number): EndpointResponse;
}

type Out<S> = InferArg<S, undefined>;

export interface EndpointDef<
	Env extends AppEnv,
	B extends Schema | undefined,
	Q extends Schema | undefined,
	P extends Schema | undefined,
> {
	path: string;
	method: HttpMethod;
	/** Public endpoints need no per-install secret; private ones live behind a hash. */
	visibility?: 'public' | 'private';
	/** `'user'` requires an authenticated Rocket.Chat user (populates `ctx.actor`). */
	auth?: 'none' | 'user';
	bodySchema?: B;
	querySchema?: Q;
	paramsSchema?: P;
	handler(ctx: EndpointContext<Env, Out<B>, Out<Q>, Out<P>>): Promise<EndpointResponse>;
}

export const ENDPOINT = Symbol.for('rc.app-sdk.endpoint');

export type Endpoint<
	Env extends AppEnv = AppEnv,
	B extends Schema | undefined = Schema | undefined,
	Q extends Schema | undefined = Schema | undefined,
	P extends Schema | undefined = Schema | undefined,
> = EndpointDef<Env, B, Q, P> & { readonly [ENDPOINT]: true };

export function defineEndpoint<
	B extends Schema | undefined = undefined,
	Q extends Schema | undefined = undefined,
	P extends Schema | undefined = undefined,
	Env extends AppEnv = BaseEnv,
>(def: EndpointDef<Env, B, Q, P>): Endpoint<Env, B, Q, P> {
	if (!def.path.startsWith('/')) {
		throw new Error(`defineEndpoint: "path" must start with "/" (got ${JSON.stringify(def.path)})`);
	}
	return { ...def, [ENDPOINT]: true };
}
