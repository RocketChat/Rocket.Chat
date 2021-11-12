import { Endpoints } from '../../../definition/rest';
import { Awaited } from '../../../definition/utils';
import { IUser } from '../../../definition/IUser';


export type ChangeTypeOfKeys<
	T extends object,
	Keys extends keyof T,
	NewType
> = {
	[key in keyof T]: key extends Keys ? NewType : T[key]
}

type This = {
	getPaginationItems(): ({
		offset: number;
		count: number;
	});
	parseJsonQuery(): ({
		sort: Record<string, unknown>;
		fields: Record<string, unknown>;
		query: Record<string, unknown>;
	});
	readonly urlParams: Record<string, unknown>;
	getUserFromParams(): IUser;
}

type ThisLoggedIn = {
	readonly user: IUser;
	readonly userId: string;
}

type ThisLoggedOut = {
	readonly user: null;
	readonly userId: null;
}

type EndpointWithExtraOptions<FN extends (this: any, ...args: any) => any, A> = WrappedFunction<FN> | ({ action: WrappedFunction<FN> } & (A extends true ? { twoFactorRequired: boolean } : {}));

export type Methods<T, A = false> = {
	[K in keyof T as `${Lowercase<string & K>}`]: T[K] extends (...args: any) => any ? EndpointWithExtraOptions<(this: This & (A extends true ? ThisLoggedIn : ThisLoggedOut) & Params<K, Parameters<T[K]>[0]>) => ReturnType<T[K]>, A> : never;
};

type Params<K, P> = K extends 'GET' ? { readonly queryParams: Partial<P> } : K extends 'POST' ? { readonly bodyParams: Partial<P> } : never;

type SuccessResult<T = undefined> = {
	statusCode: 200;
	success: true;
} & T extends (undefined) ? {} : { body: T }

type UnauthorizedResult = {
	statusCode: 403;
	body: {
		success: false;
		error: string;
	};
}

type FailureResult<T = undefined, ET = undefined, ST = undefined, E = undefined> = {
	statusCode: 400;
} & FailureBody<T, ET, ST, { success: false }>;

type FailureBody<T, ET, ST, E> = Exclude<T, string> extends object ? { body: T & E } : {
	body: E & { error: string } & E extends Error ? { details: string } : {} & ST extends undefined ? {} : { stack: string } & ET extends undefined ? {} : { errorType: string };
}

type Errors = FailureResult | FailureResult<object> | FailureResult<string, string, string, { error: string }> | UnauthorizedResult;

type WrappedFunction<T extends (this: any, ...args: any) => any> = (this: ThisParameterType<T>, ...args: Parameters<T>) => ReturnTypes<T>;

type ReturnTypes<T extends (this: any, ...args: any) => any> = PromisedOrNot<SuccessResult<ReturnType<T>> | PromisedOrNot<Errors>>;

type PromisedOrNot<T> = Promise<T> | T;

type Options = {
	permissionsRequired?: string[];
	twoFactorOptions?: unknown;
	twoFactorRequired?: boolean;
	authRequired?: boolean;
}

export type RestEndpoints<P extends keyof Endpoints, A = false> = Methods<Endpoints[P], A>;

type ToLowerCaseKeys<T> = {
	[K in keyof T as `${Lowercase<string & K>}`]: T[K];
};
type ToResultType<T> = {
	[K in keyof T]: T[K] extends (...args: any) => any ? Awaited<ReturnTypes<T[K]>> : never;
}
export type ResultTypeEndpoints<P extends keyof Endpoints, A = false> = ToResultType<ToLowerCaseKeys<Endpoints[P]>>;

declare class APIClass {
	addRoute<P extends keyof Endpoints>(route: P, endpoints: RestEndpoints<P>): void;

	addRoute<P extends keyof Endpoints, O extends Options>(route: P, options: O, endpoints: RestEndpoints<P, O['authRequired'] extends true ? true: false>): void;

	unauthorized(msg?: string): UnauthorizedResult;

	failure<ET = string | undefined, ST = string | undefined, E = Error | undefined>(result: string, errorType?: ET, stack?: ST, error?: E): FailureResult<string, ET, ST, E>;

	failure(result: object): FailureResult<object>;

	failure(): FailureResult;

	success(): SuccessResult<void>;

	success<T>(result: T): SuccessResult<T>;

	defaultFieldsToExclude: {
		joinCode: 0;
		members: 0;
		importIds: 0;
		e2e: 0;
	}
}

export declare const API: {
	v1: APIClass;
	default: APIClass;
};
