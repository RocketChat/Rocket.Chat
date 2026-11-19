import type { IHttpRequest, IHttpResponse, RequestMethod } from '@rocket.chat/apps-engine/definition/accessors/index.js';

import { BaseBridge } from './BaseBridge.js';
import { PermissionDeniedError } from '../errors/PermissionDeniedError.js';
import { AppPermissionManager } from '../managers/AppPermissionManager.js';
import { AppPermissions } from '../permissions/AppPermissions.js';

export interface IHttpBridgeRequestInfo {
	appId: string;
	method: RequestMethod;
	url: string;
	request: IHttpRequest;
}

export abstract class HttpBridge extends BaseBridge {
	public async doCall(info: IHttpBridgeRequestInfo): Promise<IHttpResponse> {
		if (this.hasDefaultPermission(info.appId)) {
			return this.call(info);
		}
	}

	protected abstract call(info: IHttpBridgeRequestInfo): Promise<IHttpResponse>;

	private hasDefaultPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.networking.default)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.networking.default],
			}),
		);

		return false;
	}
}
