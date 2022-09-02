import type {
	JoinPathPattern,
	Method,
	MethodOf,
	OperationParams,
	OperationResult,
	PathPattern,
	UrlParams,
} from '@rocket.chat/rest-typings';
import type { IUser, IMethodConnection, IRoom } from '@rocket.chat/core-typings';
import type { ValidateFunction } from 'ajv';
import type { Request, Response } from 'express';

import type { ITwoFactorOptions } from '../../2fa/server/code';

type SuccessResult<T> = {
	statusCode: 200;
	body: T extends object ? { success: true } & T : T;
};

type FailureResult<T, TStack = undefined, TErrorType = undefined, TErrorDetails = undefined> = {
	statusCode: 400;
	body: T extends object
		? { success: false } & T
		: {
				success: false;
				error: T;
				stack: TStack;
				errorType: TErrorType;
				details: TErrorDetails;
		  } & (undefined extends TErrorType ? object : { errorType: TErrorType }) &
				(undefined extends TErrorDetails ? object : { details: TErrorDetails extends string ? unknown : TErrorDetails });
};

type UnauthorizedResult<T> = {
	statusCode: 403;
	body: {
		success: false;
		error: T | 'unauthorized';
	};
};

type NotFoundResult = {
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

type Options = (
	| {
			permissionsRequired?:
				| string[]
				| ({ [key in Method]?: string[] } & { '*'?: string[] })
				| ({ [key in Method]?: { operation: TOperation; permissions: string[] } } & {
						'*'?: { operation: TOperation; permissions: string[] };
				  });
			authRequired?: boolean;
			forceTwoFactorAuthenticationForNonEnterprise?: boolean;
	  }
	| {
			authRequired: true;
			twoFactorRequired: true;
			twoFactorOptions?: ITwoFactorOptions;
	  }
) & {
	validateParams?: ValidateFunction | { [key in Method]?: ValidateFunction };
	authOrAnonRequired?: true;
};

type PartialThis = {
	readonly request: Request & { query: Record<string, string> };
	readonly response: Response;
};

type UserInfo = IUser & {
	email?: string;
	settings: {
		profile: object;
		preferences: unknown;
	};
	avatarUrl: string;
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
			: Partial<OperationParams<TMethod, TPathPattern>>
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
		: Partial<OperationParams<TMethod, TPathPattern>>;
	readonly request: Request;

	readonly queryOperations: TOptions extends { queryOperations: infer T } ? T : never;

	/* @deprecated */
	requestParams(): OperationParams<TMethod, TPathPattern>;
	getLoggedInUser(): TOptions extends { authRequired: true } ? IUser : IUser | undefined;
	getPaginationItems(): {
		readonly offset: number;
		readonly count: number;
	};
	parseJsonQuery(): {
		sort: Record<string, 1 | -1>;
		fields: Record<string, 0 | 1>;
		query: Record<string, unknown>;
	};
	/* @deprecated */
	getUserFromParams(): IUser;
	/* @deprecated */
	isUserFromParams(): boolean;
	/* @deprecated */
	getUserInfo(
		me: IUser,
	): TOptions extends { authRequired: true } ? UserInfo : TOptions extends { authOrAnonRequired: true } ? UserInfo | undefined : undefined;
	composeRoomWithLastMessage(room: IRoom, userId: string): IRoom;
} & (TOptions extends { authRequired: true }
	? {
			readonly user: IUser;
			readonly userId: string;
			readonly token: string;
	  }
	: TOptions extends { authOrAnonRequired: true }
	? {
			readonly user?: IUser;
			readonly userId?: string;
			readonly token?: string;
	  }
	: {
			readonly user: null;
			readonly userId: undefined;
			readonly token?: string;
	  });

export type ResultFor<TMethod extends Method, TPathPattern extends PathPattern> =
	| SuccessResult<OperationResult<TMethod, TPathPattern>>
	| FailureResult<unknown, unknown, unknown, unknown>
	| UnauthorizedResult<unknown>
	| NotFoundResult;

type Action<TMethod extends Method, TPathPattern extends PathPattern, TOptions> =
	| ((this: ActionThis<TMethod, TPathPattern, TOptions>) => Promise<ResultFor<TMethod, TPathPattern>>)
	| ((this: ActionThis<TMethod, TPathPattern, TOptions>) => ResultFor<TMethod, TPathPattern>);

type Operation<TMethod extends Method, TPathPattern extends PathPattern, TEndpointOptions> =
	| Action<TMethod, TPathPattern, TEndpointOptions>
	| ({
			action: Action<TMethod, TPathPattern, TEndpointOptions>;
	  } & { twoFactorRequired: boolean });

type Operations<TPathPattern extends PathPattern, TOptions extends Options = object> = {
	[M in MethodOf<TPathPattern> as Lowercase<M>]: Operation<Uppercase<M>, TPathPattern, TOptions>;
};

declare class APIClass<TBasePath extends string = '/'> {
	fieldSeparator: string;

	updateRateLimiterDictionaryForRoute(route: string, rateLimiterDictionary: number): void;

	limitedUserFieldsToExclude(fields: { [x: string]: unknown }, limitedUserFieldsToExclude: unknown): { [x: string]: unknown };

	limitedUserFieldsToExcludeIfIsPrivilegedUser(
		fields: { [x: string]: unknown },
		limitedUserFieldsToExcludeIfIsPrivilegedUser: unknown,
	): { [x: string]: unknown };

	processTwoFactor({
		userId,
		request,
		invocation,
		options,
		connection,
	}: {
		userId: string;
		request: Request;
		invocation: { twoFactorChecked: boolean };
		options?: Options;
		connection: IMethodConnection;
	}): void;

	addRoute<TSubPathPattern extends string>(
		subpath: TSubPathPattern,
		operations: Operations<JoinPathPattern<TBasePath, TSubPathPattern>>,
	): void;

	addRoute<TSubPathPattern extends string, TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>>(
		subpaths: TSubPathPattern[],
		operations: Operations<TPathPattern>,
	): void;

	addRoute<TSubPathPattern extends string, TOptions extends Options>(
		subpath: TSubPathPattern,
		options: TOptions,
		operations: Operations<JoinPathPattern<TBasePath, TSubPathPattern>, TOptions>,
	): void;

	addRoute<TSubPathPattern extends string, TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>, TOptions extends Options>(
		subpaths: TSubPathPattern[],
		options: TOptions,
		operations: Operations<TPathPattern, TOptions>,
	): void;

	addAuthMethod(func: (this: PartialThis, ...args: any[]) => any): void;

	success<T>(result: T): SuccessResult<T>;

	success(): SuccessResult<void>;

	failure<T, TErrorType extends string, TStack extends string, TErrorDetails>(
		result: T,
		errorType?: TErrorType,
		stack?: TStack,
		error?: { details: TErrorDetails },
	): FailureResult<T, TErrorType, TStack, TErrorDetails>;

	failure<T>(result: T): FailureResult<T>;

	failure(): FailureResult<void>;

	notFound(msg?: string): NotFoundResult;

	unauthorized<T>(msg?: T): UnauthorizedResult<T>;

	defaultFieldsToExclude: {
		joinCode: 0;
		members: 0;
		importIds: 0;
		e2e: 0;
	};
}

export declare const API: {
	v1: APIClass<'/v1'>;
	default: APIClass;
	helperMethods: Map<string, (...args: any[]) => unknown>;
	ApiClass: APIClass;
};

export declare const defaultRateLimiterOptions: {
	numRequestsAllowed: number;
	intervalTimeInMS: number;
};
