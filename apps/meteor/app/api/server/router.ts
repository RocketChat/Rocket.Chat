/* eslint-disable @typescript-eslint/naming-convention */
import type { Method } from '@rocket.chat/rest-typings';
import type { AnySchema } from 'ajv';
import express from 'express';
import type { HonoRequest, MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import qs from 'qs'; // Using qs specifically to keep express compatibility

import type { TypedAction, TypedOptions } from './definition';
import { honoAdapter } from './middlewares/honoAdapter';

type MiddlewareHandlerListAndActionHandler<TOptions extends TypedOptions, TSubPathPattern extends string> = [
	...MiddlewareHandler[],
	TypedAction<TOptions, TSubPathPattern>,
];

function splitArray<T, U>(arr: [...T[], U]): [T[], U] {
	const last = arr[arr.length - 1];
	const rest = arr.slice(0, -1) as T[];
	return [rest, last as U];
}

export type Route = {
	responses: Record<
		number,
		{
			description: string;
			content: {
				'application/json': {
					schema: AnySchema;
				};
			};
		}
	>;
	parameters?: {
		schema: AnySchema;
		in: 'query';
		name: 'query';
		required: true;
	}[];
	requestBody?: {
		required: true;
		content: {
			'application/json': {
				schema: AnySchema;
			};
		};
	};
	security?: {
		userId: [];
		authToken: [];
	}[];
	tags?: string[];
};
declare module 'hono' {
	interface ContextVariableMap {
		'route': string;
		'bodyParams-override'?: Record<string, any>;
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
	protected innerRouter: Hono<{
		Variables: {
			remoteAddress: string;
		};
	}>;

	constructor(readonly base: TBasePath) {
		this.innerRouter = new Hono();
	}

	public typedRoutes: Record<string, Record<string, Route>> = {};

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

	private async parseBodyParams(request: HonoRequest, overrideBodyParams: Record<string, any> = {}) {
		if (Object.keys(overrideBodyParams).length !== 0) {
			return overrideBodyParams;
		}

		try {
			let parsedBody = {};
			const contentType = request.header('content-type');

			if (contentType?.includes('application/json')) {
				parsedBody = await request.raw.clone().json();
			} else if (contentType?.includes('multipart/form-data')) {
				parsedBody = await request.raw.clone().formData();
			} else {
				parsedBody = await request.raw.clone().text();
			}
			// This is necessary to keep the compatibility with the previous version, otherwise the bodyParams will be an empty string when no content-type is sent
			if (parsedBody === '') {
				return {};
			}

			if (Array.isArray(parsedBody)) {
				return parsedBody;
			}

			return { ...parsedBody };
			// eslint-disable-next-line no-empty
		} catch {}

		return {};
	}

	private parseQueryParams(request: HonoRequest) {
		return qs.parse(request.raw.url.split('?')?.[1] || '');
	}

	private method<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		method: Method,
		subpath: TSubPathPattern,
		options: TOptions,
		...actions: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: Method;
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		const [middlewares, action] = splitArray(actions);

		this.innerRouter[method.toLowerCase() as Lowercase<Method>](`/${subpath}`.replace('//', '/'), ...middlewares, async (c) => {
			const { req, res } = c;
			req.raw.route = `${c.var.route ?? ''}${subpath}`;
			if (options.query) {
				const validatorFn = options.query;
				if (typeof options.query === 'function' && !validatorFn(req.query())) {
					return c.json(
						{
							success: false,
							errorType: 'error-invalid-params',
							error: validatorFn.errors?.map((error: any) => error.message).join('\n '),
						},
						400,
					);
				}
			}

			const bodyParams = await this.parseBodyParams(req, c.var['bodyParams-override']);

			if (options.body) {
				const validatorFn = options.body;
				if (typeof options.body === 'function' && !validatorFn((req as any).bodyParams || bodyParams)) {
					return c.json(
						{
							success: false,
							errorType: 'error-invalid-params',
							error: validatorFn.errors?.map((error: any) => error.message).join('\n '),
						},
						400,
					);
				}
			}

			const {
				body,
				statusCode = 200,
				headers = {},
			} = await action.apply(
				{
					requestIp: c.get('remoteAddress'),
					urlParams: req.param(),
					queryParams: this.parseQueryParams(req),
					bodyParams,
					request: req.raw.clone(),
					path: req.path,
					response: res,
				} as any,
				[req.raw.clone()],
			);
			if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE) {
				const responseValidatorFn = options?.response?.[statusCode];
				if (!responseValidatorFn && options.typed) {
					throw new Error(`Missing response validator for endpoint ${req.method} - ${req.url} with status code ${statusCode}`);
				}
				if (responseValidatorFn && !responseValidatorFn(body) && options.typed) {
					throw new Error(
						`Invalid response for endpoint ${req.method} - ${req.url}. Error: ${responseValidatorFn.errors?.map((error: any) => error.message).join('\n ')}`,
					);
				}
			}

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

			const isContentLess = (statusCode: number): statusCode is 101 | 204 | 205 | 304 => {
				return [101, 204, 205, 304].includes(statusCode);
			};

			if (isContentLess(statusCode)) {
				return c.status(statusCode);
			}

			return c.body(
				(contentType?.match(/json|javascript/) ? JSON.stringify(body) : body) as any,
				statusCode,
				responseHeaders as Record<string, string>,
			);
		});
		this.registerTypedRoutes(method, subpath, options);
		return this;
	}

	get<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...action: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'GET';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		return this.method('GET', subpath, options, ...action);
	}

	post<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...action: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'POST';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		return this.method('POST', subpath, options, ...action);
	}

	put<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...action: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'PUT';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		return this.method('PUT', subpath, options, ...action);
	}

	delete<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...action: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'DELETE';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		return this.method('DELETE', subpath, options, ...action);
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

			this.innerRouter.route(innerRouter.base, innerRouter.innerRouter);
		}
		if (typeof innerRouter === 'function') {
			this.innerRouter.use(innerRouter as any);
		}
		return this as any;
	}

	get router(): express.Router {
		// eslint-disable-next-line new-cap
		const router = express.Router();
		const hono = new Hono();
		router.use(
			this.base,
			honoAdapter(
				hono
					.use(`${this.base}/*`, (c, next) => {
						c.set('route', `${c.var.route || ''}${this.base}`);
						return next();
					})
					.route(this.base, this.innerRouter)
					.options('*', (c) => {
						return c.body('OK');
					}),
			),
		);
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
