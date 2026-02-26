import type { IncomingMessage } from 'node:http';

import type { ResponseSchema } from '@rocket.chat/http-router';
import { Router } from '@rocket.chat/http-router';
import type { Context } from 'hono';

import type { TypedOptions } from './definition';

type HonoContext = Context<{
	Bindings: { incoming: IncomingMessage };
	Variables: {
		remoteAddress: string;
		bodyParams: Record<string, unknown>;
		queryParams: Record<string, unknown>;
	};
}>;

export type APIActionContext = {
	requestIp: string;
	urlParams: Record<string, string>;
	queryParams: Record<string, unknown>;
	bodyParams: Record<string, unknown>;
	request: Request;
	path: string;
	response: any;
	route: string;
	incoming: IncomingMessage;
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

			const request = req.raw.clone();

			const context: APIActionContext = {
				requestIp: c.get('remoteAddress'),
				urlParams: req.param(),
				queryParams: c.get('queryParams'),
				bodyParams: c.get('bodyParams'),
				request,
				path: req.path,
				response: res,
				route: req.routePath,
				incoming: c.env.incoming,
			};

			return action.apply(context, [request]);
		};
	}
}

export type ExtractRouterEndpoints<TRoute extends RocketChatAPIRouter<any, any>> =
	TRoute extends RocketChatAPIRouter<any, infer TOperations> ? TOperations : never;
