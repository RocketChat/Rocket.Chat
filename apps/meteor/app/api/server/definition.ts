import type { IUser } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import type { Method, MethodOf, OperationParams, OperationResult, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import type { ValidateFunction } from 'ajv';
import type { Request, Response } from 'express';

import type { ITwoFactorOptions } from '../../2fa/server/code';

export type SuccessResult<T> = {
	statusCode: 200;
	body: T extends object ? { success: true } & T : T;
};

export type FailureResult<T, TStack = undefined, TErrorType = undefined, TErrorDetails = undefined> = {
	statusCode: 400;
	body: T extends object
		? { success: false } & T
		: {
				success: false;
				error?: T;
				stack?: TStack;
				errorType?: TErrorType;
				details?: TErrorDetails;
				message?: string;
		  } & (undefined extends TErrorType ? object : { errorType: TErrorType }) &
				(undefined extends TErrorDetails ? object : { details: TErrorDetails extends string ? unknown : TErrorDetails });
};

export type UnauthorizedResult<T> = {
	statusCode: 403;
	body: {
		success: false;
		error: T | 'unauthorized';
	};
};

export type InternalError<T> = { statusCode: 500; body: { error: T | 'Internal error occured'; success: false } };

export type NotFoundResult = {
	statusCode: 404;
	body: {
		success: false;
		error: string;
	};
};

export type TOperation = 'hasAll' | 'hasAny';
export type NonEnterpriseTwoFactorOptions = {
	authRequired: true;
	forceTwoFactorAuthenticationForNonEnterprise: true;
	twoFactorRequired: true;
	permissionsRequired?: string[] | { [key in Method]: string[] } | { [key in Method]: { operation: TOperation; permissions: string[] } };
	twoFactorOptions: ITwoFactorOptions;
};

export type Options = (
	| {
			permissionsRequired?:
				| string[]
				| ({ [key in Method]?: string[] } & { '*'?: string[] })
				| ({ [key in Method]?: { operation: TOperation; permissions: string[] } } & {
						'*'?: { operation: TOperation; permissions: string[] };
				  });
			authRequired?: boolean;
			forceTwoFactorAuthenticationForNonEnterprise?: boolean;
			rateLimiterOptions?:
				| {
						numRequestsAllowed?: number;
						intervalTimeInMS?: number;
				  }
				| boolean;
			queryOperations?: string[];
			queryFields?: string[];
	  }
	| {
			permissionsRequired?:
				| string[]
				| ({ [key in Method]?: string[] } & { '*'?: string[] })
				| ({ [key in Method]?: { operation: TOperation; permissions: string[] } } & {
						'*'?: { operation: TOperation; permissions: string[] };
				  });
			authRequired: true;
			twoFactorRequired: true;
			twoFactorOptions?: ITwoFactorOptions;
			rateLimiterOptions?:
				| {
						numRequestsAllowed?: number;
						intervalTimeInMS?: number;
				  }
				| boolean;

			queryOperations?: string[];
			queryFields?: string[];
	  }
) & {
	validateParams?: ValidateFunction | { [key in Method]?: ValidateFunction };
	authOrAnonRequired?: true;
	deprecationVersion?: string;
};

export type PartialThis = {
	readonly request: Request & { query: Record<string, string> };
	readonly response: Response;
	readonly userId: string;
	readonly bodyParams: Record<string, unknown>;
	readonly queryParams: Record<string, string>;
	readonly queryOperations?: string[];
	readonly queryFields?: string[];
	readonly logger: Logger;
};

export type UserInfo = IUser & {
	email?: string;
	settings: {
		profile: object;
		preferences: unknown;
	};
	avatarUrl: string;
};

export type ActionThis<TMethod extends Method, TPathPattern extends PathPattern, TOptions> = {
	readonly requestIp: string;
	urlParams: UrlParams<TPathPattern>;
	readonly response: Response;
	// TODO make it unsafe
	readonly queryParams: TMethod extends 'GET'
		? TOptions extends { validateParams: ValidateFunction<infer T> }
			? T
			: TOptions extends { validateParams: { GET: ValidateFunction<infer T> } }
			? T
			: Partial<OperationParams<TMethod, TPathPattern>> & { offset?: number; count?: number }
		: Record<string, string>;
	// TODO make it unsafe
	readonly bodyParams: TMethod extends 'GET'
		? Record<string, unknown>
		: TOptions extends { validateParams: ValidateFunction<infer T> }
		? T
		: TOptions extends { validateParams: infer V }
		? V extends { [key in TMethod]: ValidateFunction<infer T> }
			? T
			: Partial<OperationParams<TMethod, TPathPattern>>
		: // TODO remove the extra (optionals) params when all the endpoints that use these are typed correctly
		  Partial<OperationParams<TMethod, TPathPattern>>;
	readonly request: Request;

	readonly queryOperations: TOptions extends { queryOperations: infer T } ? T : never;
	parseJsonQuery(): Promise<{
		sort: Record<string, 1 | -1>;
		fields: Record<string, 0 | 1>;
		query: Record<string, unknown>;
	}>;
} & (TOptions extends { authRequired: true }
	? {
			user: IUser;
			userId: string;
			readonly token: string;
	  }
	: TOptions extends { authOrAnonRequired: true }
	? {
			user?: IUser;
			userId?: string;
			readonly token?: string;
	  }
	: {
			user?: IUser | null;
			userId?: string | undefined;
			readonly token?: string;
	  });

export type ResultFor<TMethod extends Method, TPathPattern extends PathPattern> =
	| SuccessResult<OperationResult<TMethod, TPathPattern>>
	| FailureResult<unknown, unknown, unknown, unknown>
	| UnauthorizedResult<unknown>
	| NotFoundResult
	| {
			statusCode: number;
			body: unknown;
	  };

export type Action<TMethod extends Method, TPathPattern extends PathPattern, TOptions> =
	| ((this: ActionThis<TMethod, TPathPattern, TOptions>) => Promise<ResultFor<TMethod, TPathPattern>>)
	| ((this: ActionThis<TMethod, TPathPattern, TOptions>) => ResultFor<TMethod, TPathPattern>);

export type Operation<TMethod extends Method, TPathPattern extends PathPattern, TEndpointOptions> =
	| Action<TMethod, TPathPattern, TEndpointOptions>
	| ({
			action: Action<TMethod, TPathPattern, TEndpointOptions>;
	  } & { twoFactorRequired: boolean });

export type Operations<TPathPattern extends PathPattern, TOptions extends Options = object> = {
	[M in MethodOf<TPathPattern> as Lowercase<M>]: Operation<Uppercase<M>, TPathPattern, TOptions>;
};
