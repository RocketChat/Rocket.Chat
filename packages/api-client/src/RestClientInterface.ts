import type { Serialized } from '@rocket.chat/core-typings/dist';
import type { MatchPathPattern, OperationParams, OperationResult, PathFor } from '@rocket.chat/rest-typings';

type Next<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

export type Middleware<T extends (...args: any[]) => any> = (context: Parameters<T>, next: Next<T>) => ReturnType<T>;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface RestClientInterface {
	get<TPath extends PathFor<'GET'>>(
		endpoint: TPath,
		params: void extends OperationParams<'GET', MatchPathPattern<TPath>> ? never : OperationParams<'GET', MatchPathPattern<TPath>>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'GET', MatchPathPattern<TPath>>>>;

	get<TPath extends PathFor<'GET'>>(
		endpoint: TPath,
		params?: void extends OperationParams<'GET', MatchPathPattern<TPath>> ? undefined : never,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'GET', MatchPathPattern<TPath>>>>;

	post<TPath extends PathFor<'POST'>>(
		endpoint: TPath,
		params: void extends OperationParams<'POST', MatchPathPattern<TPath>> ? void : OperationParams<'POST', MatchPathPattern<TPath>>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'POST', MatchPathPattern<TPath>>>>;

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

	put<TPath extends PathFor<'PUT'>>(
		endpoint: TPath,
		params: void extends OperationParams<'PUT', MatchPathPattern<TPath>> ? void : OperationParams<'PUT', MatchPathPattern<TPath>>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'PUT', MatchPathPattern<TPath>>>>;

	delete<TPath extends PathFor<'DELETE'>>(
		endpoint: TPath,
		params: void extends OperationParams<'DELETE', MatchPathPattern<TPath>> ? void : OperationParams<'DELETE', MatchPathPattern<TPath>>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'DELETE', MatchPathPattern<TPath>>>>;
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
