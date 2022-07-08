import type { Serialized } from '@rocket.chat/core-typings';
import type {
	MatchPathPattern,
	OperationParams,
	OperationResult,
	PathFor,
	PathWithParamsFor,
	PathWithoutParamsFor,
} from '@rocket.chat/rest-typings';

type Next<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

export type Middleware<T extends (...args: any[]) => any> = (context: Parameters<T>, next: Next<T>) => ReturnType<T>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface RestClientInterface {
	get<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'GET'> = PathWithParamsFor<'GET'>>(
		endpoint: TPath,
		params: OperationParams<'GET', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'GET', TPathPattern>>>;

	get<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'GET'> = PathWithoutParamsFor<'GET'>>(
		endpoint: TPath,
		params?: undefined,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'GET', TPathPattern>>>;

	post<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'POST'> = PathWithParamsFor<'POST'>>(
		endpoint: TPath,
		params: OperationParams<'POST', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'POST', TPathPattern>>>;

	post<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'POST'> = PathWithoutParamsFor<'POST'>>(
		endpoint: TPath,
		params?: undefined,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'POST', TPathPattern>>>;

	put<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'PUT'> = PathWithParamsFor<'PUT'>>(
		endpoint: TPath,
		params: OperationParams<'PUT', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'PUT', TPathPattern>>>;

	put<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'PUT'> = PathWithoutParamsFor<'PUT'>>(
		endpoint: TPath,
		params?: undefined,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'PUT', TPathPattern>>>;

	delete<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'DELETE'> = PathWithParamsFor<'DELETE'>>(
		endpoint: TPath,
		params: OperationParams<'DELETE', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'DELETE', TPathPattern>>>;

	delete<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'DELETE'> = PathWithoutParamsFor<'DELETE'>>(
		endpoint: TPath,
		params?: undefined,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'DELETE', TPathPattern>>>;

	upload<TPath extends PathFor<'POST'>>(
		endpoint: TPath,
		params: void extends OperationParams<'POST', MatchPathPattern<TPath>> ? void : OperationParams<'POST', MatchPathPattern<TPath>>,
		events?: {
			load?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
			progress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
			abort?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
			error?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
		},
	): XMLHttpRequest;

	getCredentials():
		| {
				'X-User-Id': string;
				'X-Auth-Token': string;
		  }
		| undefined;
	setCredentials(credentials: undefined | { 'X-User-Id': string; 'X-Auth-Token': string }): void;

	use(middleware: Middleware<RestClientInterface['send']>): void;

	send(endpoint: string, method: string, options: Omit<RequestInit, 'method'>): Promise<Response>;
}
