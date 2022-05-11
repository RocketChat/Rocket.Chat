import type { Serialized } from '../../core-typings/dist';
import type { MatchPathPattern, OperationParams, OperationResult, PathFor } from '../../rest-typings/dist';
import type { RestClientInterface } from './RestClientInterface';

export { RestClientInterface };

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

	get<TPath extends PathFor<'GET'>>(
		endpoint: TPath,
		params: void extends OperationParams<'GET', MatchPathPattern<TPath>> ? void : OperationParams<'GET', MatchPathPattern<TPath>>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<Serialized<OperationResult<'GET', MatchPathPattern<TPath>>>>;

	get<TPath extends string>(
		endpoint: TPath,
		...args: [params: Record<string, unknown> | void, options?: Omit<RequestInit, 'method'>] | []
	): Promise<unknown>;

	get<TPath extends PathFor<'GET'> | string>(
		endpoint: TPath,
		params: TPath extends PathFor<'GET'>
			? void extends OperationParams<'GET', MatchPathPattern<TPath>>
				? void
				: OperationParams<'GET', MatchPathPattern<TPath>>
			: Record<string, string>,
		options?: Omit<RequestInit, 'method'>,
	): Promise<TPath extends PathFor<'GET'> ? Serialized<OperationResult<'GET', MatchPathPattern<TPath>>> : unknown> {
		return this.send(`${endpoint}?${this.getParams(params)}`, 'GET', options);
	}

	post: RestClientInterface['post'] = (endpoint, params, { headers, ...options } = {}) => {
		return this.send(endpoint, 'POST', {
			body: JSON.stringify(params),

			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				...headers,
			},

			...options,
		});
	};

	put: RestClientInterface['put'] = (endpoint, params, { headers, ...options } = {}) => {
		return this.send(endpoint, 'PUT', {
			body: JSON.stringify(params),

			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				...headers,
			},

			...options,
		});
	};

	delete: RestClientInterface['delete'] = (endpoint, params, options) => {
		return this.send(endpoint, 'DELETE', options);
	};

	protected getCredentialsAsHeaders(): Record<string, string> {
		const credentials = this.getCredentials();
		return credentials
			? {
					'X-User-Id': credentials['X-User-Id'],
					'X-Auth-Token': credentials['X-Auth-Token'],
			  }
			: {};
	}

	protected send<T>(endpoint: string, method: string, { headers, ...options }: Omit<RequestInit, 'method'> = {}): Promise<T> {
		return fetch(`${this.baseUrl}${endpoint}`, {
			...options,
			headers: { ...this.getCredentialsAsHeaders(), ...this.headers, ...headers },
			method,
		}).then(function (response) {
			return response.json();
		}) as Promise<T>;
	}

	protected getParams(data: Record<string, object | number | string | boolean> | void): string {
		return data
			? Object.entries(data)
					.map(function ([k, data]) {
						return `${encodeURIComponent(
							k,
						)}=${typeof data === 'object' ? encodeURIComponent(JSON.stringify(data)) : encodeURIComponent(data)}`;
					})
					.join('&')
			: '';
	}
}
