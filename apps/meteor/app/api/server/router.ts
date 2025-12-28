/* eslint-disable @typescript-eslint/naming-convention */
import type { ResponseSchema } from '@rocket.chat/http-router';
import { Router } from '@rocket.chat/http-router';
import type { Context as HonoContext } from 'hono';

import type { TypedOptions } from './definition';

declare module 'hono' {
	interface ContextVariableMap {
		'route': string;
		'bodyParams-override'?: Record<string, any>;
	}
}

export type APIActionContext = {
	requestIp: string;
	urlParams: Record<string, string>;
	queryParams: Record<string, any>;
	bodyParams: Record<string, any>;
	request: Request;
	path: string;
	response: any;
	route: string;
};

export type APIActionHandler = (this: APIActionContext, request: Request) => Promise<ResponseSchema<TypedOptions>>;

export class RocketChatAPIRouter<
	TBasePath extends string,
	TOperations extends {
		[x: string]: unknown;
	} = NonNullable<unknown>,
> extends Router<TBasePath, TOperations, APIActionHandler> {
	protected override convertActionToHandler(action: APIActionHandler): (c: HonoContext) => Promise<ResponseSchema<TypedOptions>> {
		return async (c: HonoContext): Promise<ResponseSchema<TypedOptions>> => {
			const { req, res } = c;
			const queryParams = this.parseQueryParams(req);
			const bodyParams = await this.parseBodyParams<{ bodyParamsOverride: Record<string, any> }>({
				request: req,
				extra: { bodyParamsOverride: c.var['bodyParams-override'] || {} },
			});
			const request = req.raw.clone();

			const context = {
				requestIp: c.get('remoteAddress'),
				urlParams: req.param(),
				queryParams,
				bodyParams,
				request,
				path: req.path,
				response: res,
				route: req.routePath,
			} as APIActionContext;

			return action.apply(context, [request]);
		};
	}
}

export type ExtractRouterEndpoints<TRoute extends RocketChatAPIRouter<any, any>> =
	TRoute extends RocketChatAPIRouter<any, infer TOperations> ? TOperations : never;
