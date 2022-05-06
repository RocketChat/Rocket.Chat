import type { RestClientInterface } from './RestClientInterface';

export { RestClientInterface };

export class RestClient implements RestClientInterface {
	private readonly baseUrl: string;

	private readonly headers: Record<string, string> = {};

	constructor({
		baseUrl,
		credentials,
	}: {
		baseUrl: string;
		credentials?: {
			'X-User-Id': string;
			'X-Auth-Token': string;
		};
	}) {
		this.baseUrl = `${baseUrl}/api`;
		if (credentials) {
			this.headers['X-User-Id'] = credentials['X-User-Id'];
			this.headers['X-Auth-Token'] = credentials['X-Auth-Token'];
		}
	}

	getCredentials: RestClientInterface['getCredentials'] = () => {
		return undefined;
	};

	get: RestClientInterface['get'] = (endpoint, params, options) => {
		return this.send(`${endpoint}?${this.getParams(params)}`, 'GET', options);
	};

	post: RestClientInterface['post'] = (endpoint, params, options) => {
		return this.send(endpoint, 'POST', options);
	};

	put: RestClientInterface['put'] = (endpoint, params, options) => {
		return this.send(endpoint, 'PUT', options);
	};

	delete: RestClientInterface['delete'] = (endpoint, params, options) => {
		return this.send(endpoint, 'DELETE', options);
	};

	protected send<T>(endpoint: string, method: string, { headers, ...options }: Omit<RequestInit, 'method'> = {}): Promise<T> {
		return fetch(`${this.baseUrl}${endpoint}`, {
			...options,
			headers: { ...this.headers, ...headers },
			method,
		}).then(function (response) {
			return response.json();
		}) as Promise<T>;
	}

	protected getHeaders(headers: Record<string, string>): Record<string, string> {
		return { ...this.headers, ...headers };
	}

	private getParams(data: Record<string, object | number | string | boolean> | void): string {
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
