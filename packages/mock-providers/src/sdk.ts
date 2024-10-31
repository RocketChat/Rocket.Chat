import type { RestClientInterface } from '@rocket.chat/api-client';
import type { Middleware } from '@rocket.chat/api-client/dist/RestClientInterface';
import type { Serialized } from '@rocket.chat/core-typings';
import type { ClientStream, StreamNames, StreamKeys, StreamerCallbackArgs, ServerMethods } from '@rocket.chat/ddp-client';
import type {
	PathFor,
	OperationParams,
	MatchPathPattern,
	OperationResult,
	PathWithParamsFor,
	PathWithoutParamsFor,
	Method,
	PathPattern,
} from '@rocket.chat/rest-typings';
import type { ISDKClient } from '@rocket.chat/ui-contexts';
import type { MatchFunction } from 'path-to-regexp';
import { match } from 'path-to-regexp';

class MockedRestClient implements RestClientInterface {
	private mocks = new Map<`${Method} ${PathPattern}`, { method: Method; match: MatchFunction<any>; response: (params: any) => any }>();

	public mockEndpoint<TMethod extends Method, TPathPattern extends PathPattern>(
		method: TMethod,
		pathPattern: TPathPattern,
		response: (
			params: OperationParams<TMethod, TPathPattern>,
		) => Serialized<OperationResult<TMethod, TPathPattern>> | Promise<Serialized<OperationResult<TMethod, TPathPattern>>>,
	) {
		this.mocks.set(`${method} ${pathPattern}`, {
			method,
			match: match(pathPattern),
			response,
		});
	}

	private performEndpoint(method: string, endpoint: string, params: any) {
		const response = Array.from(this.mocks.values()).find(({ method: m, match }) => m === method && match(endpoint))?.response;
		if (!response) throw new Error('Endpoint not implemented.');
		return Promise.resolve(response(params));
	}

	get: {
		<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'GET'> = PathWithParamsFor<'GET'>>(
			endpoint: TPath,
			params: OperationParams<'GET', TPathPattern>,
			options?: Omit<RequestInit, 'method'>,
		): Promise<Serialized<OperationResult<'GET', TPathPattern>>>;
		<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'GET'> = PathWithoutParamsFor<'GET'>>(
			endpoint: TPath,
			params?: undefined,
			options?: Omit<RequestInit, 'method'>,
		): Promise<Serialized<OperationResult<'GET', TPathPattern>>>;
	} = (endpoint: string, params: any) => this.performEndpoint('GET', endpoint, params);

	post: {
		<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'POST'> = PathWithParamsFor<'POST'>>(
			endpoint: TPath,
			params: OperationParams<'POST', TPathPattern>,
			options?: Omit<RequestInit, 'method'>,
		): Promise<Serialized<OperationResult<'POST', TPathPattern>>>;
		<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'POST'> = PathWithoutParamsFor<'POST'>>(
			endpoint: TPath,
			params?: undefined,
			options?: Omit<RequestInit, 'method'>,
		): Promise<Serialized<OperationResult<'POST', TPathPattern>>>;
	} = (endpoint: string, params: any) => this.performEndpoint('POST', endpoint, params);

	put: {
		<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'PUT'> = PathWithParamsFor<'PUT'>>(
			endpoint: TPath,
			params: OperationParams<'PUT', TPathPattern>,
			options?: Omit<RequestInit, 'method'>,
		): Promise<Serialized<OperationResult<'PUT', TPathPattern>>>;
		<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'PUT'> = PathWithoutParamsFor<'PUT'>>(
			endpoint: TPath,
			params?: undefined,
			options?: Omit<RequestInit, 'method'>,
		): Promise<Serialized<OperationResult<'PUT', TPathPattern>>>;
	} = (endpoint: string, params: any) => this.performEndpoint('PUT', endpoint, params);

	delete: {
		<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'DELETE'> = PathWithParamsFor<'DELETE'>>(
			endpoint: TPath,
			params: OperationParams<'DELETE', TPathPattern>,
			options?: Omit<RequestInit, 'method'>,
		): Promise<Serialized<OperationResult<'DELETE', TPathPattern>>>;
		<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'DELETE'> = PathWithoutParamsFor<'DELETE'>>(
			endpoint: TPath,
			params?: undefined,
			options?: Omit<RequestInit, 'method'>,
		): Promise<Serialized<OperationResult<'DELETE', TPathPattern>>>;
	} = (endpoint: string, params: any) => this.performEndpoint('DELETE', endpoint, params);

	upload: <TPath extends PathFor<'POST'>>(
		endpoint: TPath,
		params: void extends OperationParams<'POST', MatchPathPattern<TPath>> ? void : OperationParams<'POST', MatchPathPattern<TPath>>,
		events?: {
			load?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
			progress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
			abort?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
			error?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
		},
		options?: Omit<RequestInit, 'method'>,
	) => XMLHttpRequest = () => {
		throw new Error('Method not implemented.');
	};

	getCredentials: () =>
		| {
				'X-User-Id': string;
				'X-Auth-Token': string;
		  }
		| undefined = () => {
		throw new Error('Method not implemented.');
	};

	setCredentials: (credentials: undefined | { 'X-User-Id': string; 'X-Auth-Token': string }) => void = () => {
		throw new Error('Method not implemented.');
	};

	use: (middleware: Middleware<RestClientInterface['send']>) => void = () => {
		throw new Error('Method not implemented.');
	};

	send: (endpoint: string, method: string, options?: Omit<RequestInit, 'method'>) => Promise<Response> = () => {
		throw new Error('Method not implemented.');
	};

	handleTwoFactorChallenge: (
		cb: (args: { method: 'totp' | 'email' | 'password'; emailOrUsername?: string; invalidAttempt?: boolean }) => Promise<string>,
	) => void = () => {
		throw new Error('Method not implemented.');
	};
}

export class MockedSDKClient implements ISDKClient {
	rest = new MockedRestClient();

	stop: (streamName: string, key: string) => void = () => {
		throw new Error('not implemented');
	};

	stream: {
		(name: string, params: unknown[], cb: (...data: unknown[]) => void): ReturnType<ClientStream['subscribe']>;
		<N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			key: K,
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): ReturnType<ClientStream['subscribe']>;
		<N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			args: [key: K, ...args: unknown[]],
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): ReturnType<ClientStream['subscribe']>;
	} = () => {
		throw new Error('not implemented');
	};

	publish: (name: string, args: unknown[]) => void = () => {
		throw new Error('not implemented');
	};

	private methodMocks = new Map<string, (...args: any[]) => any>();

	public mockMethod<T extends keyof ServerMethods>(method: T, response: ServerMethods[T]) {
		this.methodMocks.set(method, response);
	}

	call: <T extends keyof ServerMethods>(method: T, ...args: Parameters<ServerMethods[T]>) => Promise<ReturnType<ServerMethods[T]>> = (
		method,
		...args
	) => {
		const response = this.methodMocks.get(method);
		if (!response) throw new Error('Endpoint not implemented.');
		return Promise.resolve(response(...args));
	};
}
