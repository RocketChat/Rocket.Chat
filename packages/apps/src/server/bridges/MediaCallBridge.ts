import type { IMediaCall } from '@rocket.chat/apps-engine/definition/mediaCalls/IMediaCall';

import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class MediaCallBridge extends BaseBridge {
	public async doGetById(callId: string, appId: string): Promise<IMediaCall | undefined> {
		if (this.hasReadPermission(appId)) {
			return this.getById(callId, appId);
		}

		return null;
	}

	protected abstract getById(callId: string, appId: string): Promise<IMediaCall | undefined>;

	private hasReadPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.mediaCall.read)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.mediaCall.read],
			}),
		);

		return false;
	}
}
