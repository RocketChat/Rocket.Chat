import type { Method } from '@rocket.chat/rest-typings';
import type { AnySchema } from 'ajv';
import express from 'express';
import type { Context, HonoRequest, MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import qs from 'qs'; // Using qs specifically to keep express compatibility

import type { ResponseSchema, TypedOptions } from './definition';
import { honoAdapterForExpress } from './middlewares/honoAdapterForExpress';

type MiddlewareHandlerListAndActionHandler<TOptions extends TypedOptions, TContext = (c: Context) => Promise<ResponseSchema<TOptions>>> = [
	...MiddlewareHandler[],
	TContext,
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

export abstract class AbstractRouter<TActionCallback = (c: Context) => Promise<ResponseSchema<TypedOptions>>> {
	protected abstract convertActionToHandler(action: TActionCallback): (c: Context) => Promise<ResponseSchema<TypedOptions>>;
}

export class Router<
	TBasePath extends string,
	TOperations extends {
		[x: string]: unknown;
	} = NonNullable<unknown>,
	TActionCallback = (c: Context) => Promise<ResponseSchema<TypedOptions>>,
> extends AbstractRouter<TActionCallback> {
	protected innerRouter: Hono<{
		Variables: {
			remoteAddress: string;
		};
	}>;

	constructor(readonly base: TBasePath) {
		super();
		this.innerRouter = new Hono();
	}

	public typedRoutes: Record<string, Record<string, Route>> = {};

	protected registerTypedRoutes<
		TSubPathPattern extends string,
		TOptions extends TypedOptions,
		TPathPattern extends `${TBasePath}/${TSubPathPattern}`,
	>(method: Method, subpath: TSubPathPattern, options: TOptions): void {
		const path = `/${this.base}/${subpath}`.replaceAll('//', '/') as TPathPattern;
		this.typedRoutes = this.typedRoutes || {};
		this.typedRoutes[path] = this.typedRoutes[subpath] || {};
		const { query, response = {}, authRequired, body, tags, ...rest } = options;
		this.typedRoutes[path][method.toLowerCase()] = {
			responses: Object.fromEntries(
				Object.entries(response).map(([status, schema]) => [
					parseInt(status, 10),
					{
						description: '',
						content: {
							'application/json': { schema: ('schema' in schema ? schema.schema : schema) as AnySchema },
						},
					},
				]),
			),
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

	protected async parseBodyParams<T extends Record<string, any>>({ request }: { request: HonoRequest; extra?: T }) {
		try {
			let parsedBody = {};
			const contentType = request.header('content-type');

			if (contentType?.includes('application/json')) {
				parsedBody = await request.raw.clone().json();
			} else if (contentType?.includes('multipart/form-data')) {
				parsedBody = await request.raw.clone().formData();
			} else if (contentType?.includes('application/x-www-form-urlencoded')) {
				const req = await request.raw.clone().formData();
				parsedBody = Object.fromEntries(req.entries());
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

	protected parseQueryParams(request: HonoRequest) {
		return qs.parse(request.raw.url.split('?')?.[1] || '');
	}

	protected method<TSubPathPattern extends string, TOptions extends TypedOptions>(
		method: Method,
		subpath: TSubPathPattern,
		options: TOptions,
		...actions: MiddlewareHandlerListAndActionHandler<TOptions, TActionCallback>
	): Router<TBasePath, TOperations, TActionCallback> {
		const [middlewares, action] = splitArray<MiddlewareHandler, TActionCallback>(actions);
		const convertedAction = this.convertActionToHandler(action);

		this.innerRouter[method.toLowerCase() as Lowercase<Method>](`/${subpath}`.replace('//', '/'), ...middlewares, async (c) => {
			const { req, res } = c;

			const queryParams = this.parseQueryParams(req);

			if (options.query) {
				const validatorFn = options.query;
				if (typeof options.query === 'function' && !validatorFn(queryParams)) {
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

			const bodyParams = await this.parseBodyParams({ request: req });

			if (options.body) {
				const validatorFn = options.body;
				if (typeof options.body === 'function' && !validatorFn((req as any).bodyParams || bodyParams)) {
					console.log('validatorFn :', validatorFn);
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

			const response = await convertedAction(c);
			const { body, statusCode, headers } = response as {
				body: any;
				statusCode: number;
				headers?: Record<string, string>;
			};

			if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE) {
				const responseValidatorFn = options?.response?.[statusCode as keyof typeof options.response];
				/* c8 ignore next 3 */
				if (!responseValidatorFn && options.typed) {
					throw new Error(`Missing response validator for endpoint ${req.method} - ${req.url} with status code ${statusCode}`);
				}
				if (responseValidatorFn && !responseValidatorFn(body)) {
					console.log('responseValidatorFn :', responseValidatorFn);
					return c.json(
						{
							success: false,
							errorType: 'error-invalid-body',
							error: `Invalid response for endpoint ${req.method} - ${req.url}. Error: ${responseValidatorFn.errors?.map((error: any) => error.message).join('\n ')}`,
						},
						400,
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
				return c.status(statusCode as 101 | 204 | 205 | 304);
			}
			Object.entries(responseHeaders).forEach(([key, value]) => {
				if (value) {
					c.header(key, String(value));
				}
			});

			return c.body((contentType?.match(/json|javascript/) ? JSON.stringify(body) : body) as any, statusCode as StatusCode);
		});
		this.registerTypedRoutes(method, subpath, options);
		return this;
	}

	protected convertActionToHandler(action: TActionCallback): (c: Context) => Promise<ResponseSchema<TypedOptions>> {
		// Default implementation simply passes through the action
		// Subclasses can override this to provide custom handling
		return action as (c: Context) => Promise<ResponseSchema<TypedOptions>>;
	}

	get<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...action: MiddlewareHandlerListAndActionHandler<TOptions, TActionCallback>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'GET';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>),
		TActionCallback
	> {
		return this.method('GET', subpath, options, ...action);
	}

	post<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...action: MiddlewareHandlerListAndActionHandler<TOptions, TActionCallback>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'POST';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>),
		TActionCallback
	> {
		return this.method('POST', subpath, options, ...action);
	}

	put<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...action: MiddlewareHandlerListAndActionHandler<TOptions, TActionCallback>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'PUT';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>),
		TActionCallback
	> {
		return this.method('PUT', subpath, options, ...action);
	}

	delete<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...action: MiddlewareHandlerListAndActionHandler<TOptions, TActionCallback>
	): Router<
		TBasePath,
		| TOperations
		| ({
				method: 'DELETE';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>),
		TActionCallback
	> {
		return this.method('DELETE', subpath, options, ...action);
	}

	use<FN extends MiddlewareHandler>(fn: FN): Router<TBasePath, TOperations, TActionCallback>;

	use<IRouter extends Router<any, any, any>>(
		innerRouter: IRouter,
	): IRouter extends Router<any, infer IOperations, any>
		? Router<TBasePath, ConcatPathOptions<TBasePath, IOperations, TOperations>, TActionCallback>
		: never;

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
			honoAdapterForExpress(
				hono.route(this.base, this.innerRouter).options('*', (c) => {
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

export type ExtractRouterEndpoints<TRoute extends Router<any, any, any>> =
	TRoute extends Router<any, infer TOperations, any> ? TOperations : never;
