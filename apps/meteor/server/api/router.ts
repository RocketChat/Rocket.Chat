import type { IncomingMessage } from 'node:http';

import type { IUser } from '@rocket.chat/core-typings';
import type { ResponseSchema } from '@rocket.chat/http-router';
import { Router } from '@rocket.chat/http-router';
import { type Logger } from '@rocket.chat/logger';
import type { Context } from 'hono';

import type { TypedOptions } from './definition';

export type HonoContext = Context<{
	Bindings: { incoming: IncomingMessage };
	Variables: {
		remoteAddress: string;
		bodyParams: Record<string, unknown>;
		queryParams: Record<string, unknown>;
		user?: IUser | null;
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
	logger: Logger;
};

export type APIActionHandler = (this: APIActionContext, request: Request) => Promise<ResponseSchema<TypedOptions>>;

export class RocketChatAPIRouter<
	TBasePath extends string,
	TOperations extends {
		[x: string]: unknown;
	} = NonNullable<unknown>,
> extends Router<TBasePath, TOperations, APIActionHandler> {
	protected override convertActionToHandler(
		action: APIActionHandler,
		logger: Logger,
	): (c: HonoContext) => Promise<ResponseSchema<TypedOptions>> {
		return async (c: HonoContext): Promise<ResponseSchema<TypedOptions>> => {
			const { req } = c;

			const request = req.raw.clone();

			const context = convertHonoContextToApiActionContext(c, { logger });

			return action.apply(context, [request]);
		};
	}
}

export const convertHonoContextToApiActionContext = (
	c: HonoContext,
	options: {
		logger: Logger;
	},
): APIActionContext => {
	const user = c.get('user');
	return {
		requestIp: c.get('remoteAddress'),
		urlParams: c.req.param(),
		queryParams: c.get('queryParams'),
		bodyParams: c.get('bodyParams'),
		request: c.req.raw,
		path: c.req.path,
		response: c.res,
		route: c.req.routePath,
		incoming: c.env.incoming,
		logger: options.logger,
		...(user && { user, userId: user._id }),
	};
};

export type ExtractRouterEndpoints<TRoute extends RocketChatAPIRouter<any, any>> =
	TRoute extends RocketChatAPIRouter<any, infer TOperations> ? TOperations : never;
