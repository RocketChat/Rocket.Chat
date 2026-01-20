import type { IncomingMessage } from 'node:http';

import { Logger } from '@rocket.chat/logger';
import type { Method } from '@rocket.chat/rest-typings';
import type { AnySchema, ValidateFunction } from 'ajv';
import express from 'express';
import type { Context, Env, HonoRequest, Input, MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import * as z from 'zod';

import type { ResponseSchema, TypedOptions } from './definition';
import { honoAdapterForExpress } from './middlewares/honoAdapterForExpress';
import { parseQueryParams } from './parseQueryParams';

const logger = new Logger('HttpRouter');

export type RouterContext<E extends Env = any, P extends string = any, I extends Input = NonNullable<unknown>> = Context<
	{
		Bindings: { incoming: IncomingMessage };
		Variables: {
			remoteAddress: string;
			queryParams?: unknown;
			bodyParams?: unknown;
		};
	} & E,
	P,
	I
>;

type MiddlewareHandlerListAndActionHandler<
	TOptions extends TypedOptions,
	TActionHandler = (c: RouterContext) => Promise<ResponseSchema<TOptions>>,
> = [...MiddlewareHandler[], TActionHandler];

function splitArray<T, U>(arr: [...T[], U]): [T[], U] {
	const last = arr[arr.length - 1];
	const rest = arr.slice(0, -1) as T[];
	return [rest, last as U];
}

function coerceDatesToStrings(obj: unknown): unknown {
	if (Array.isArray(obj)) {
		return obj.map(coerceDatesToStrings);
	}
	if (obj && typeof obj === 'object') {
		const newObj: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value instanceof Date) {
				newObj[key] = value.toISOString();
			} else {
				newObj[key] = coerceDatesToStrings(value);
			}
		}
		return newObj;
	}
	return obj;
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

export class Router<
	TBasePath extends string,
	TOperations extends {
		[x: string]: unknown;
	} = NonNullable<unknown>,
	TActionCallback = (c: RouterContext) => Promise<ResponseSchema<TypedOptions>>,
> {
	protected readonly logger = logger;

	protected innerRouter: Hono<{
		Variables: {
			remoteAddress: string;
			queryParams?: unknown;
			bodyParams?: unknown;
		};
	}>;

	constructor(readonly base: TBasePath) {
		this.innerRouter = new Hono();
	}

	public typedRoutes: Record<string, Record<string, Route>> = {};

	private extractJSONSchema(validator: ValidateFunction | z.ZodType) {
		if ('_def' in validator) {
			return { schema: z.toJSONSchema(validator, { target: 'openapi-3.0', io: 'input', unrepresentable: 'any' }) };
		}

		return { schema: validator.schema };
	}

	protected registerTypedRoutes<
		TSubPathPattern extends string,
		TOptions extends TypedOptions,
		TPathPattern extends `${TBasePath}/${TSubPathPattern}`,
	>(method: Method, subpath: TSubPathPattern, options: TOptions): void {
		const path = `/${this.base}/${subpath}`.replaceAll('//', '/') as TPathPattern;
		this.typedRoutes = this.typedRoutes || {};
		this.typedRoutes[path] = this.typedRoutes[subpath] || {};
		const { query, response = {}, authRequired, body, tags, ...rest } = options;
		try {
			this.typedRoutes[path][method.toLowerCase()] = {
				responses: Object.fromEntries(
					Object.entries(response).map(([status, schema]) => [
						parseInt(status, 10),
						{
							description: '',
							content: {
								'application/json': this.extractJSONSchema(schema),
							},
						},
					]),
				),
				...(query && {
					parameters: [
						{
							...this.extractJSONSchema(query),
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
							'application/json': this.extractJSONSchema(body),
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
		} catch (e) {
			throw new Error(`Failed to register route ${method.toUpperCase()} ${path}`, { cause: e });
		}
	}

	protected async parseBodyParams({ request }: { request: HonoRequest }) {
		try {
			let parsedBody = {};
			const contentType = request.header('content-type');

			if (contentType?.includes('multipart/form-data')) {
				// Don't parse multipart here, routes handle it manually via UploadService.parse()
				// since multipart/form-data is only used for file uploads
				return parsedBody;
			}

			if (contentType?.includes('application/json')) {
				parsedBody = await request.raw.clone().json();
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
		return parseQueryParams(request.raw.url.split('?')?.[1] || '');
	}

	protected parse(
		data: unknown,
		validator: ValidateFunction | z.ZodType | undefined,
		{ extendedError = false }: { extendedError?: boolean } = {},
	): readonly [unknown, undefined] | readonly [undefined, string] {
		if (!validator) return [data, undefined] as const;

		if ('_def' in validator) {
			const result = validator.safeParse(data);

			if (!result.success) {
				return [undefined, z.prettifyError(result.error)] as const;
			}

			return [result.data, undefined] as const;
		}

		if (typeof validator === 'function' && !validator(data)) {
			return [
				undefined,
				validator.errors
					?.map((error) =>
						extendedError
							? `${error.message} (${[
									error.instancePath,
									Object.entries(error.params)
										.map(([key, value]) => `${key}: ${value}`)
										.join(', '),
								]
									.filter(Boolean)
									.join(' - ')})`
							: error.message,
					)
					.join('\n'),
			] as const;
		}

		return [data, undefined] as const;
	}

	protected method<TSubPathPattern extends string, TOptions extends TypedOptions>(
		method: Method,
		subpath: TSubPathPattern,
		options: TOptions,
		...actions: MiddlewareHandlerListAndActionHandler<TOptions, TActionCallback>
	): Router<TBasePath, TOperations, TActionCallback> {
		const [middlewares, action] = splitArray<MiddlewareHandler, TActionCallback>(actions);
		const convertedAction = this.convertActionToHandler(action, options);

		this.innerRouter[method.toLowerCase() as Lowercase<Method>](`/${subpath}`.replace('//', '/'), ...middlewares, async (c) => {
			const { req, res } = c;

			let queryParams: Record<string, any>;
			try {
				queryParams = this.parseQueryParams(req);
			} catch (e) {
				logger.warn({ msg: 'Error parsing query params for request', path: req.path, err: e });

				return c.json({ success: false, error: 'Invalid query parameters' }, 400);
			}
			c.set('queryParams', queryParams);

			if (options.query) {
				const [parsedQueryParams, queryValidationError] = this.parse(queryParams, options.query);

				if (queryValidationError) {
					logger.warn({
						msg: 'Query parameters validation failed - route spec does not match request payload',
						method: req.method,
						path: req.url,
						error: queryValidationError,
						bodyParams: undefined,
						queryParams,
					});
					return c.json(
						{
							success: false,
							errorType: 'error-invalid-params',
							error: queryValidationError,
						},
						400,
					);
				}

				c.set('queryParams', parsedQueryParams);
			}

			const bodyParams = await this.parseBodyParams({ request: req });
			c.set('bodyParams', bodyParams);

			if (options.body) {
				const [parsedBodyParams, bodyValidationError] = this.parse(bodyParams, options.body);

				if (bodyValidationError) {
					logger.warn({
						msg: 'Request body validation failed - route spec does not match request payload',
						method: req.method,
						path: req.url,
						error: bodyValidationError,
						bodyParams,
						queryParams: undefined,
					});
					return c.json(
						{
							success: false,
							errorType: 'invalid-params',
							error: bodyValidationError,
						},
						400,
					);
				}

				c.set('bodyParams', parsedBodyParams);
			}

			const response = await convertedAction(c);
			const { body, statusCode, headers } = response as {
				body: any;
				statusCode: number;
				headers?: Record<string, string>;
			};

			// TODO encode response always instead of validating it in test mode
			if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE) {
				const responseSchema = options?.response?.[statusCode as keyof typeof options.response];

				/* c8 ignore next 3 */
				if (!responseSchema && options.typed) {
					throw new Error(`Missing response validator for endpoint ${req.method} - ${req.url} with status code ${statusCode}`);
				}

				const [, responseValidationError] = this.parse(coerceDatesToStrings(body), responseSchema, { extendedError: true });

				if (responseValidationError) {
					logger.warn({
						msg: 'Response validation failed - response does not match route spec',
						method: req.method,
						path: req.url,
						error: responseValidationError,
						originalResponse: body,
					});
					return c.json(
						{
							success: false,
							errorType: 'error-invalid-body',
							error: `Invalid response for endpoint ${req.method} - ${req.url}. Error: ${responseValidationError}`,
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

	protected convertActionToHandler<TOptions extends TypedOptions>(
		action: TActionCallback,
		_options: TOptions,
	): (c: RouterContext) => Promise<ResponseSchema<TOptions>> {
		// Default implementation simply passes through the action
		// Subclasses can override this to provide custom handling
		return action as (c: RouterContext) => Promise<ResponseSchema<TOptions>>;
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

	getHonoRouter(): Hono<{
		Variables: {
			remoteAddress: string;
		};
	}> {
		return this.innerRouter;
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
