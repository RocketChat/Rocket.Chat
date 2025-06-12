/* eslint-disable @typescript-eslint/naming-convention */
import { Router } from '@rocket.chat/http-router';
import type { HonoRequest, MiddlewareHandler, Context as HonoContext } from 'hono';

import type { TypedAction, TypedOptions } from './definition';

type MiddlewareHandlerListAndActionHandler<TOptions extends TypedOptions, TSubPathPattern extends string> = [
	...MiddlewareHandler[],
	TypedAction<TOptions, TSubPathPattern>,
];

function splitArray<T, U>(arr: [...T[], U]): [T[], U] {
	const last = arr[arr.length - 1];
	const rest = arr.slice(0, -1) as T[];
	return [rest, last as U];
}
declare module 'hono' {
	interface ContextVariableMap {
		'route': string;
		'bodyParams-override'?: Record<string, any>;
	}
}

export class RocketChatAPIRouter<
	TBasePath extends string,
	TOperations extends {
		[x: string]: unknown;
	} = NonNullable<unknown>,
> extends Router<TBasePath, TOperations> {
	protected async parseBodyParams<T extends Record<string, any>>({ request, extra }: { request: HonoRequest; extra?: T }) {
		if (extra && Object.keys(extra.bodyParamsOverride || {}).length !== 0) {
			return extra;
		}

		return super.parseBodyParams({ request });
	}

	protected _convertToHonoAction(action: TypedAction<any, any>): (c: HonoContext) => Promise<any> {
		return async (c: HonoContext) => {
			const { req, res } = c;
			const queryParams = super.parseQueryParams(req);
			const bodyParams = await this.parseBodyParams<{ bodyParamsOverride: Record<string, any> }>({
				request: req,
				extra: { bodyParamsOverride: c.var['bodyParams-override'] || {} },
			});
			const request = req.raw.clone();

			return action.apply(
				{
					requestIp: c.get('remoteAddress'),
					urlParams: req.param(),
					queryParams,
					bodyParams,
					request,
					path: req.path,
					response: res,
					route: req.routePath,
				} as any,
				[request],
			);
		};
	}

	public get<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...actions: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): RocketChatAPIRouter<
		TBasePath,
		| TOperations
		| ({
				method: 'GET';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		const [middlewares, typedActionHandler] = splitArray(actions);
		const honoAction = this._convertToHonoAction(typedActionHandler);

		return super.method('GET', subpath, options, ...middlewares, honoAction) as this;
	}

	public post<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...actions: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): RocketChatAPIRouter<
		TBasePath,
		| TOperations
		| ({
				method: 'POST';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		const [middlewares, typedActionHandler] = splitArray(actions);
		const honoAction = this._convertToHonoAction(typedActionHandler);

		return super.method('POST', subpath, options, ...middlewares, honoAction) as this;
	}

	public put<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...actions: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): RocketChatAPIRouter<
		TBasePath,
		| TOperations
		| ({
				method: 'PUT';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		const [middlewares, typedActionHandler] = splitArray(actions);
		const honoAction = this._convertToHonoAction(typedActionHandler);

		return super.method('PUT', subpath, options, ...middlewares, honoAction) as this;
	}

	public delete<TSubPathPattern extends string, TOptions extends TypedOptions, TPathPattern extends `${TBasePath}/${TSubPathPattern}`>(
		subpath: TSubPathPattern,
		options: TOptions,
		...actions: MiddlewareHandlerListAndActionHandler<TOptions, TSubPathPattern>
	): RocketChatAPIRouter<
		TBasePath,
		| TOperations
		| ({
				method: 'DELETE';
				path: TPathPattern;
		  } & Omit<TOptions, 'response'>)
	> {
		const [middlewares, typedActionHandler] = splitArray(actions);
		const honoAction = this._convertToHonoAction(typedActionHandler);

		return super.method('DELETE', subpath, options, ...middlewares, honoAction) as this;
	}
}

export type ExtractRouterEndpoints<TRoute extends RocketChatAPIRouter<any, any>> =
	TRoute extends RocketChatAPIRouter<any, infer TOperations> ? TOperations : never;
