import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export type ServerEndpointHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IServerEndpointCallInfo {
	appId: string;
	method: ServerEndpointHttpMethod;
	/** Endpoint path under /api/v1, may start with or without leading slash */
	path: string;
	/** Query string parameters for GET requests */
	query?: Record<string, any>;
	/** JSON-serializable body for POST/PUT requests or string/Buffer */
	body?: unknown;
	/** Optional extra headers to forward to the handler */
	headers?: Record<string, string>;
	/**
	 * Optional calling user context. If provided with both id and token, the
	 * call will be executed on behalf of this user. If omitted or incomplete,
	 * the bridge should fall back to the App user credentials.
	 */
	user?: { id: string; token?: string };
}

export interface IServerEndpointResponse<T = unknown> {
	statusCode: number;
	headers: Record<string, string>;
	/** Raw response body as string (when not binary) */
	content?: string;
	/** Parsed JSON, when applicable */
	data?: T | null;
}

export abstract class ServerEndpointsBridge extends BaseBridge {
	public async doCall<T = unknown>(info: IServerEndpointCallInfo): Promise<IServerEndpointResponse<T>> {
		// Require explicit permission to call internal server endpoints
		if (!AppPermissionManager.hasPermission(info.appId, AppPermissions['server-endpoints'].call)) {
			AppPermissionManager.notifyAboutError(
				new PermissionDeniedError({ appId: info.appId, missingPermissions: [AppPermissions['server-endpoints'].call] }),
			);
			throw new PermissionDeniedError({ appId: info.appId, missingPermissions: [AppPermissions['server-endpoints'].call] });
		}

		// Impersonation requires stronger permission
		if (info.user?.id && !info.user?.token) {
			if (!AppPermissionManager.hasPermission(info.appId, AppPermissions['server-endpoints'].impersonate)) {
				AppPermissionManager.notifyAboutError(
					new PermissionDeniedError({ appId: info.appId, missingPermissions: [AppPermissions['server-endpoints'].impersonate] }),
				);
				throw new PermissionDeniedError({ appId: info.appId, missingPermissions: [AppPermissions['server-endpoints'].impersonate] });
			}
		}

		return this.call<T>(info);
	}

	protected abstract call<T = unknown>(info: IServerEndpointCallInfo): Promise<IServerEndpointResponse<T>>;
}
