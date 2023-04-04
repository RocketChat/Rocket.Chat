import { stringify } from 'query-string';
import type { Serialized } from '@rocket.chat/core-typings';
import type {
	MatchPathPattern,
	ParamsFor,
	OperationResult,
	PathFor,
	PathWithoutParamsFor,
	PathWithParamsFor,
} from '@rocket.chat/rest-typings';

import type { Middleware, RestClientInterface } from './RestClientInterface';

export { RestClientInterface };

const pipe =
	<T extends (...args: any[]) => any>(fn: T) =>
	(...args: Parameters<T>): ReturnType<T> =>
		fn(...args);

function buildFormData(data?: Record<string, any> | void, formData = new FormData(), parentKey?: string): FormData {
	if (data instanceof FormData) {
		return data;
	}
	if (!data) {
		return formData;
	}

	if (typeof data === 'object' && !(data instanceof File)) {
		Object.keys(data).forEach((key) => {
			buildFormData(formData, data[key], parentKey ? `${parentKey}[${key}]` : key);
		});
	} else {
		data && parentKey && formData.append(parentKey, data);
	}
	return formData;
}

const checkIfIsFormData = (data: any = {}): boolean => {
	if (data instanceof FormData) {
		return true;
	}
	return Object.values(data).some((value) => {
		if (value && typeof value === 'object' && !(value instanceof File)) {
			return checkIfIsFormData(value);
		}
		return value instanceof File;
	});
};

export class RestClient implements RestClientInterface {
	private readonly baseUrl: string;

	private headers: Record<string, string> = {};

	private credentials:
		| {
				'X-User-Id': string;
				'X-Auth-Token': string;
		  }
		| undefined;

	constructor({
		baseUrl,
		credentials,
		headers = {},
	}: {
		baseUrl: string;
		credentials?: {
			'X-User-Id': string;
			'X-Auth-Token': string;
		};
		headers?: Record<string, string>;
	}) {
		this.baseUrl = `${baseUrl}/api`;
		this.setCredentials(credentials);
		this.headers = headers;
	}

	getCredentials(): ReturnType<RestClientInterface['getCredentials']> {
		return this.credentials;
	}

	setCredentials: RestClientInterface['setCredentials'] = (credentials) => {
		this.credentials = credentials;
	};

	get<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'GET'> = PathWithParamsFor<'GET'>>(
		endpoint: TPath,
		params: ParamsFor<'GET', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'GET', TPathPattern>>>;

	get<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'GET'> = PathWithoutParamsFor<'GET'>>(
		endpoint: TPath,
		params?: undefined,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'GET', TPathPattern>>>;

	async get<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathFor<'GET'>>(
		endpoint: TPath,
		params?: ParamsFor<'GET', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'GET', TPathPattern>>> {
		if (/\?/.test(endpoint)) {
			// throw new Error('Endpoint cannot contain query string');
			console.warn('Endpoint cannot contain query string', endpoint);
		}
		const queryParams = this.getParams(params);
		const response = await this.send(`${endpoint}${queryParams ? `?${queryParams}` : ''}`, 'GET', options ?? {});
		return response.json();
	}

	post<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'POST'> = PathWithParamsFor<'POST'>>(
		endpoint: TPath,
		params: ParamsFor<'POST', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'POST', TPathPattern>>>;

	post<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'POST'> = PathWithoutParamsFor<'POST'>>(
		endpoint: TPath,
		params?: undefined,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'POST', TPathPattern>>>;

	async post<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathFor<'POST'>>(
		endpoint: TPath,
		params?: ParamsFor<'POST', TPathPattern>,
		{ headers, ...options }: Omit<RequestInit, 'method'> = {},
	): Promise<Serialized<OperationResult<'POST', TPathPattern>>> {
		const isFormData = checkIfIsFormData(params);

		const response = await this.send(endpoint, 'POST', {
			body: isFormData ? buildFormData(params) : JSON.stringify(params),

			headers: {
				Accept: 'application/json',
				...(!isFormData && { 'Content-Type': 'application/json' }),
				...headers,
			},

			...options,
		});

		// If the server sent no data, return an empty record as we're only expecting objects.
		if (response.status === 204) {
			return {} as any;
		}

		return response.json();
	}

	put<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'PUT'> = PathWithParamsFor<'PUT'>>(
		endpoint: TPath,
		params: ParamsFor<'PUT', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'PUT', TPathPattern>>>;

	put<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'PUT'> = PathWithoutParamsFor<'PUT'>>(
		endpoint: TPath,
		params?: undefined,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'PUT', TPathPattern>>>;

	async put<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathFor<'PUT'>>(
		endpoint: TPath,
		params?: ParamsFor<'PUT', TPathPattern>,
		{ headers, ...options }: Omit<RequestInit, 'method'> = {},
	): Promise<Serialized<OperationResult<'PUT', TPathPattern>>> {
		const isFormData = checkIfIsFormData(params);
		const response = await this.send(endpoint, 'PUT', {
			body: isFormData ? buildFormData(params) : JSON.stringify(params),

			headers: {
				Accept: 'application/json',
				...(!isFormData && { 'Content-Type': 'application/json' }),
				...headers,
			},

			...options,
		});
		return response.json();
	}

	delete<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithParamsFor<'DELETE'> = PathWithParamsFor<'DELETE'>>(
		endpoint: TPath,
		params: ParamsFor<'DELETE', TPathPattern>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'DELETE', TPathPattern>>>;

	delete<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathWithoutParamsFor<'DELETE'> = PathWithoutParamsFor<'DELETE'>>(
		endpoint: TPath,
		params?: undefined,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'DELETE', TPathPattern>>>;

	async delete<TPathPattern extends MatchPathPattern<TPath>, TPath extends PathFor<'DELETE'>>(
		endpoint: TPath,
		_params?: ParamsFor<'DELETE', TPathPattern>,
		options: Omit<RequestInit, 'method'> = {},
	): Promise<Serialized<OperationResult<'DELETE', TPathPattern>>> {
		const response = await this.send(endpoint, 'DELETE', options ?? {});
		return response.json();
	}

	protected getCredentialsAsHeaders(): Record<string, string> {
		const credentials = this.getCredentials();
		return credentials
			? {
					'X-User-Id': credentials['X-User-Id'],
					'X-Auth-Token': credentials['X-Auth-Token'],
			  }
			: {};
	}

	send(endpoint: string, method: string, { headers, ...options }: Omit<RequestInit, 'method'> = {}): Promise<Response> {
		return fetch(`${this.baseUrl}${`/${endpoint}`.replace(/\/+/, '/')}`, {
			...options,
			headers: { ...this.getCredentialsAsHeaders(), ...this.headers, ...headers },
			method,
		}).then(function (response) {
			if (!response.ok) {
				return Promise.reject(response);
			}
			return response;
		});
	}

	protected getParams(data: Record<string, object | number | string | boolean> | void): string {
		return data ? stringify(data, { arrayFormat: 'bracket' }) : '';
	}

	upload: RestClientInterface['upload'] = (endpoint, params, events) => {
		if (!params) {
			throw new Error('Missing params');
		}
		const xhr = new XMLHttpRequest();
		const data = new FormData();

		Object.entries(params as any).forEach(([key, value]) => {
			if (value instanceof File) {
				data.append(key, value, value.name);
				return;
			}
			value && data.append(key, value as any);
		});

		xhr.open('POST', `${this.baseUrl}${`/${endpoint}`.replace(/\/+/, '/')}`, true);
		Object.entries(this.getCredentialsAsHeaders()).forEach(([key, value]) => {
			xhr.setRequestHeader(key, value);
		});

		if (events?.load) {
			xhr.upload.addEventListener('load', events.load);
		}
		if (events?.progress) {
			xhr.upload.addEventListener('progress', events.progress);
		}
		if (events?.error) {
			xhr.addEventListener('error', events.error);
		}
		if (events?.abort) {
			xhr.addEventListener('abort', events.abort);
		}

		xhr.send(data);

		return xhr;
	};

	use(middleware: Middleware<RestClientInterface['send']>): void {
		const fn = this.send.bind(this);
		this.send = function (this: RestClient, ...context: Parameters<RestClientInterface['send']>): ReturnType<RestClientInterface['send']> {
			return middleware(context, pipe(fn));
		} as RestClientInterface['send'];
	}
}
