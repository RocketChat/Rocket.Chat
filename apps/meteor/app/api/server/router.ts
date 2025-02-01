import type { Method } from '@rocket.chat/rest-typings';
import express from 'express';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';

import type { TypedAction, TypedOptions } from './definition';
import { honoAdapter } from './middlewares/honoAdapter';

declare module 'hono' {
	interface ContextVariableMap {
		route: string;
	}
}

declare global {
	interface Request {
		route: string;
	}
}

export class Router<
	TBasePath extends string,
	TOperations extends {
		[x: string]: unknown;
	} = NonNullable<unknown>,
> {
	private middleware: (router: Hono) => void = () => void 0;

	constructor(readonly base: TBasePath) {}

	public typedRoutes: Record<string, Record<string, unknown>> = {};

	private registerTypedRoutes<
		TSubPathPattern extends string,
		TOptions extends TypedOptions,
		TPathPattern extends `${TBasePath}/${TSubPathPattern}`,
	>(method: Method, subpath: TSubPathPattern, options: TOptions): void {
		const path = `/${this.base}/${subpath}`.replaceAll('//', '/') as TPathPattern;
		this.typedRoutes = this.typedRoutes || {};
		this.typedRoutes[path] = this.typedRoutes[subpath] || {};
		const { query, authRequired, response, body, tags, ...rest } = options;
		this.typedRoutes[path][method.toLowerCase()] = {
			...(response && {
				responses: Object.fromEntries(
					Object.entries(response).map(([status, schema]) => [
						status,
						{
							description: '',
							content: {
								'application/json': 'schema' in schema ? { schema: schema.schema } : schema,
							},
						},
					]),
				),
			}),
			...(query && {
				parameters: [
					{
						schema: query.schema,
						in: 'query',
						name: 'query',
						required: true,
					},
				],
			}),
			...(body && {
				requestBody: {
					required: true,
					content: {
						'application/json': { schema: body.schema },
					},
				},
			}),
			...(authRequired && {
				...rest,
				security: [
					{
						userId: [],
						authToken: [],
					},
				],
			}),
			tags,
		};
	}

	private method<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		method: Method,
		subpath: TSubPathPattern,
		options: TOptions,
		action: TypedAction<TOptions, TSubPathPattern>,
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: Method;
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		const prev = this.middleware;
		this.middleware = (router: Hono) => {
			prev(router);
			router[method.toLowerCase() as Lowercase<Method>](`/${subpath}`.replace('//', '/'), async (c) => {
				const { req, res } = c;

				req.raw.route = `${c.var.route ?? ''}${subpath}`;

				const {
					body,
					statusCode = 200,
					headers = {},
				} = await action.apply(
					{
						urlParams: req.param(),
						queryParams: req.query(),
						bodyParams: await (req.header('content-type')?.includes('application/json') ? c.req.json() : req.text()),
						request: req.raw,
						response: res,
					} as any,
					[req.raw],
				);

				const responseHeaders = Object.fromEntries(
					Object.entries({
						...res.headers,
						'Content-Type': 'application/json',
						'Cache-Control': 'no-store',
						'Pragma': 'no-cache',
						...headers,
					}).map(([key, value]) => [key.toLowerCase(), value]),
				);

				const contentType = (responseHeaders['content-type'] || 'application/json') as string;

				return c.body(
					(contentType?.match(/json|javascript/) ? JSON.stringify(body) : body) as any,
					statusCode,
					responseHeaders as Record<string, string>,
				);
			});
		};
		this.registerTypedRoutes(method, subpath, options);
		return this;
	}

	get<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		action: TypedAction<TOptions, TSubPathPattern>,
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'GET';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		return this.method('GET', subpath, options, action);
	}

	post<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		action: TypedAction<TOptions, TSubPathPattern>,
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'POST';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		return this.method('POST', subpath, options, action);
	}

	put<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		action: TypedAction<TOptions, TSubPathPattern>,
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'PUT';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		return this.method('PUT', subpath, options, action);
	}

	delete<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		action: TypedAction<TOptions, TSubPathPattern>,
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'DELETE';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		return this.method('DELETE', subpath, options, action);
	}

	use<FN extends MiddlewareHandler>(fn: FN): Router<TBasePath, TOperations>;

	use<IRouter extends Router<any, any>>(
		innerRouter: IRouter,
	): IRouter extends Router<any, infer IOperations> ? Router<TBasePath, ConcatPathOptions<TBasePath, IOperations, TOperations>> : never;

	use(innerRouter: unknown): any {
		if (innerRouter instanceof Router) {
			this.typedRoutes = {
				...this.typedRoutes,
				...Object.fromEntries(Object.entries(innerRouter.typedRoutes).map(([path, routes]) => [`${this.base}${path}`, routes])),
			};

			const prev = this.middleware;
			this.middleware = (router: Hono) => {
				prev(router);

				router
					.use(`${innerRouter.base}/*`, (c, next) => {
						c.set('route', `${c.var.route || ''}${innerRouter.base}`);
						return next();
					})
					.route(innerRouter.base, innerRouter.honoRouter);
			};
		}
		if (typeof innerRouter === 'function') {
			const prev = this.middleware;
			this.middleware = (router: Hono) => {
				prev(router);
				router.use(innerRouter as any);
			};
		}
		return this as any;
	}

	get honoRouter(): Hono {
		const router = new Hono().basePath(this.base).use(`${this.base}/*`, (c, next) => {
			c.set('route', `${c.var.route || ''}${this.base}`);
			return next();
		});
		this.middleware(router);
		return router.options('*', (c) => {
			return c.body('OK');
		});
	}

	get router(): express.Router {
		// eslint-disable-next-line new-cap
		const router = express.Router();
		router.use(this.base, honoAdapter(this.honoRouter));
		return router;
	}
}

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

type ConcatPathOptions<
	TPath extends string,
	TOptions extends {
		[x: string]: unknown;
	},
	TOther extends {
		[x: string]: unknown;
	},
> = Prettify<
	Filter<
		{
			[x in keyof TOptions]: x extends 'path' ? (TOptions[x] extends string ? `${TPath}${TOptions[x]}` : never) : TOptions[x];
		} & TOther
	>
>;

type Filter<
	TOther extends {
		[x: string]: unknown;
	},
> = TOther extends { method: Method; path: string } ? TOther : never;

export type ExtractRouterEndpoints<TRoute extends Router<any, any>> = TRoute extends Router<any, infer TOperations> ? TOperations : never;
