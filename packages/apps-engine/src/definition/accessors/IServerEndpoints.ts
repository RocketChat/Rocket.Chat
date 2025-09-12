export type ServerEndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IServerEndpointCallOptions {
	method: ServerEndpointMethod;
	/** Endpoint under /api/v1, without the prefix. Example: 'users.info' */
	path: string;
	query?: Record<string, unknown>;
	body?: unknown;
	headers?: Record<string, string>;
	/**
	 * Optional: act on behalf of this user (impersonation). The engine mints a short‑lived token internally.
	 */
	userId?: string;
}

export interface IServerEndpointResponse<T = unknown> {
	statusCode: number;
	headers: Record<string, string>;
	content?: string;
	data?: T | null;
}

export interface IServerEndpoints {
	call<T = unknown>(options: IServerEndpointCallOptions): Promise<IServerEndpointResponse<T>>;
}
