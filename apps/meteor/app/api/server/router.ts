import type { Method } from '@rocket.chat/rest-typings';
import type { AnySchema } from 'ajv';
import express from 'express';

import type { TypedAction, TypedOptions } from './definition';

type MiddlewareHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => void;

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

export class Router<
	TBasePath extends string,
	TOperations extends {
		[x: string]: unknown;
	} = NonNullable<unknown>,
> {
	private middleware: (router: express.Router) => void = () => void 0;

	constructor(readonly base: TBasePath) {}

	private typedRoutes: Record<string, Record<string, Route>> = {};

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

		const prev = this.middleware;
		this.middleware = (router: express.Router) => {
			prev(router);
			router[method.toLowerCase() as Lowercase<Method>](`/${subpath}`.replace('//', '/'), ...middlewares, async (req, res) => {
				if (options.query) {
					const validatorFn = options.query;
					if (typeof options.query === 'function' && !validatorFn(req.query)) {
						return res.status(400).json({
							success: false,
							errorType: 'error-invalid-params',
							error: validatorFn.errors?.map((error: any) => error.message).join('\n '),
						});
					}
				}

				if (options.body) {
					const validatorFn = options.body;
					if (typeof options.body === 'function' && !validatorFn((req as any).bodyParams || req.body)) {
						return res.status(400).json({
							success: false,
							errorType: 'error-invalid-params',
							error: validatorFn.errors?.map((error: any) => error.message).join('\n '),
						});
					}
				}

				const {
					body,
					statusCode = 200,
					headers = {},
				} = await action.apply(
					{
						urlParams: req.params,
						queryParams: req.query,
						bodyParams: (req as any).bodyParams || req.body,
						request: req,
						response: res,
					} as any,
					[req],
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
						...res.header,
						'Content-Type': 'application/json',
						'Cache-Control': 'no-store',
						'Pragma': 'no-cache',
						...headers,
					}).map(([key, value]) => [key.toLowerCase(), value]),
				);

				res.writeHead(statusCode, responseHeaders);

				if (responseHeaders['content-type']?.match(/json|javascript/) !== null) {
					body !== undefined && res.write(JSON.stringify(body));
				} else {
					body !== undefined && res.write(body);
				}

				res.end();
			});
		};
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

	use<FN extends (req: express.Request, res: express.Response, next: express.NextFunction) => void>(fn: FN): Router<TBasePath, TOperations>;

	use<IRouter extends Router<any, any>>(
		innerRouter: IRouter,
	): IRouter extends Router<any, infer IOperations> ? Router<TBasePath, ConcatPathOptions<TBasePath, IOperations, TOperations>> : never;

	use(innerRouter: any): any {
		if (innerRouter instanceof Router) {
			this.typedRoutes = {
				...this.typedRoutes,
				...Object.fromEntries(Object.entries(innerRouter.typedRoutes).map(([path, routes]) => [`${this.base}${path}`, routes])),
			};

			const prev = this.middleware;
			this.middleware = (router: express.Router) => {
				prev(router);
				router.use(innerRouter.router);
			};
		}
		if (typeof innerRouter === 'function') {
			const prev = this.middleware;
			this.middleware = (router: express.Router) => {
				prev(router);
				router.use(innerRouter);
			};
		}
		return this as any;
	}

	get router(): express.Router {
		// eslint-disable-next-line new-cap
		const router = express.Router();
		// eslint-disable-next-line new-cap
		const innerRouter = express.Router();
		this.middleware(innerRouter);
		router.use(this.base, innerRouter);
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
