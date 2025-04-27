import type { IUser, LicenseModule } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import type { Method, MethodOf, OperationParams, OperationResult, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import type { ValidateFunction } from 'ajv';

import type { ITwoFactorOptions } from '../../2fa/server/code';

export type SuccessStatusCodes = Exclude<Range<208>, Range<200>>;

export type RedirectStatusCodes = Exclude<Range<308>, Range<300>>;

export type AuthorizationStatusCodes = Exclude<Range<451>, Range<400>>;

export type ErrorStatusCodes = Exclude<Exclude<Range<511>, Range<500>>, 509>;

export type SuccessResult<T, TStatusCode extends SuccessStatusCodes = 200> = {
	statusCode: TStatusCode;
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

export type RedirectResult<T, TStatusCode extends RedirectStatusCodes = 300> = {
	statusCode: TStatusCode;
	body: T;
};

export type UnauthorizedResult<T> = {
	statusCode: 401;
	body: {
		success: false;
		error: T | 'unauthorized';
	};
};

export type ForbiddenResult<T> = {
	statusCode: 403;
	body: {
		success: false;
		// TODO: MAJOR remove 'unauthorized'
		error: T | 'forbidden' | 'unauthorized';
	};
};

export type InternalError<T, StatusCode extends ErrorStatusCodes = 500, D = 'Internal server error'> = {
	statusCode: StatusCode;
	body: {
		error: T | D;
		success: false;
	};
};

export type NotFoundResult<T = string> = {
	statusCode: 404;
	body: {
		success: false;
		error: T;
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
	/**
	 * @deprecated The `validateParams` option is deprecated. Use `query` and/OR `body` instead.
	 */
	validateParams?: ValidateFunction | { [key in Method]?: ValidateFunction };
	authOrAnonRequired?: true;
	deprecation?: {
		version: string;
		alternatives?: string[];
	};
};

export type PartialThis = {
	readonly request: Request & { query: Record<string, string> };
	readonly response: Response;
	readonly userId: string;
	readonly bodyParams: Record<string, unknown>;
	readonly path: string;
	readonly queryParams: Record<string, string>;
	readonly queryOperations?: string[];
	readonly queryFields?: string[];
	readonly logger: Logger;
};

type ActionThis<TMethod extends Method, TPathPattern extends PathPattern, TOptions> = {
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
		/**
		 * @deprecated To access "fields" parameter, use ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS environment variable.
		 */
		fields: Record<string, 0 | 1>;
		/**
		 * @deprecated To access "query" parameter, use ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS environment variable.
		 */
		query: Record<string, unknown>;
	}>;

	readonly connection: {
		token: string;
		id: string;
		close: () => void;
		clientAddress: string;
		httpHeaders: Record<string, any>;
	};
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

export type InnerAction<TMethod extends Method, TPathPattern extends PathPattern, TOptions> =
	Action<TMethod, TPathPattern, TOptions> extends (this: infer This) => infer Result
		? This extends ActionThis<TMethod, TPathPattern, TOptions>
			? (this: Mutable<This>) => Result
			: never
		: never;

type Mutable<Immutable> = {
	-readonly [key in keyof Immutable]: Immutable[key];
};

type Operation<TMethod extends Method, TPathPattern extends PathPattern, TEndpointOptions> =
	| Action<TMethod, TPathPattern, TEndpointOptions>
	| ({
			action: Action<TMethod, TPathPattern, TEndpointOptions>;
	  } & { twoFactorRequired: boolean });

type ActionOperation<TMethod extends Method, TPathPattern extends PathPattern, TEndpointOptions extends Options = object> = {
	action: Action<TMethod, TPathPattern, TEndpointOptions>;
} & TEndpointOptions;

export type Operations<TPathPattern extends PathPattern, TOptions extends Options = object> = {
	[M in MethodOf<TPathPattern> as Lowercase<M>]: Operation<Uppercase<M>, TPathPattern, TOptions>;
};

export type ActionOperations<TPathPattern extends PathPattern, TOptions extends Options = object> = {
	[M in MethodOf<TPathPattern> as Lowercase<M>]: ActionOperation<Uppercase<M>, TPathPattern, TOptions>;
};

type Range<N extends number, Result extends number[] = []> = Result['length'] extends N
	? Result[number]
	: Range<N, [...Result, Result['length']]>;

type HTTPStatusCodes = SuccessStatusCodes | RedirectStatusCodes | AuthorizationStatusCodes | ErrorStatusCodes;
export type TypedOptions = {
	response: {
		[K in HTTPStatusCodes]?: ValidateFunction;
	};
	query?: ValidateFunction;
	body?: ValidateFunction;
	tags?: string[];
	typed?: boolean;
	license?: LicenseModule[];
} & Options;

export type TypedThis<TOptions extends TypedOptions, TPath extends string = ''> = {
	userId: TOptions['authRequired'] extends true ? string : string | undefined;
	user: TOptions['authRequired'] extends true ? IUser : IUser | null;
	token: TOptions['authRequired'] extends true ? string : string | undefined;
	queryParams: TOptions['query'] extends ValidateFunction<infer Query> ? Query : never;
	urlParams: UrlParams<TPath> extends Record<any, any> ? UrlParams<TPath> : never;
	parseJsonQuery(): Promise<{
		sort: Record<string, 1 | -1>;
		/**
		 * @deprecated To access "fields" parameter, use ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS environment variable.
		 */
		fields: Record<string, 0 | 1>;
		/**
		 * @deprecated To access "query" parameter, use ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS environment variable.
		 */
		query: Record<string, unknown>;
	}>;
	bodyParams: TOptions['body'] extends ValidateFunction<infer Body> ? Body : never;

	requestIp?: string;
};

type PromiseOrValue<T> = T | Promise<T>;

type InferResult<TResult> = TResult extends ValidateFunction<infer T> ? T : TResult;

type Results<TResponse extends TypedOptions['response']> = {
	[K in keyof TResponse]: K extends SuccessStatusCodes
		? SuccessResult<InferResult<TResponse[200]>, K>
		: K extends RedirectStatusCodes
			? RedirectResult<InferResult<TResponse[300]>, K>
			: K extends 400
				? FailureResult<InferResult<TResponse[400]>>
				: K extends 401
					? UnauthorizedResult<InferResult<TResponse[401]>>
					: K extends 403
						? ForbiddenResult<InferResult<TResponse[403]>>
						: K extends 404
							? NotFoundResult<InferResult<TResponse[404]>>
							: K extends ErrorStatusCodes
								? InternalError<InferResult<TResponse[500]>, K>
								: never;
}[keyof TResponse] & {
	headers?: Record<string, string>;
};

export type TypedAction<
	TOptions extends TypedOptions,
	TPath extends string = '',
	TThis extends TypedThis<TOptions, TPath> = TypedThis<TOptions, TPath>,
> = (this: TThis, request: Request) => PromiseOrValue<Results<TOptions['response']>>;
