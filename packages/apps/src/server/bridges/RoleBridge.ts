import type { IRole } from '@rocket.chat/apps-engine/definition/roles/index.js';

import { BaseBridge } from './BaseBridge.js';
import { PermissionDeniedError } from '../errors/PermissionDeniedError.js';
import { AppPermissionManager } from '../managers/AppPermissionManager.js';
import { AppPermissions } from '../permissions/AppPermissions.js';

export abstract class RoleBridge extends BaseBridge {
	public async doGetOneByIdOrName(idOrName: string, appId: string): Promise<IRole | null> {
		if (this.hasReadPermission(appId)) {
			return this.getOneByIdOrName(idOrName, appId);
		}
	}

	public async doGetCustomRoles(appId: string): Promise<Array<IRole>> {
		if (this.hasReadPermission(appId)) {
			return this.getCustomRoles(appId);
		}
	}

	protected abstract getOneByIdOrName(idOrName: string, appId: string): Promise<IRole | null>;

	protected abstract getCustomRoles(appId: string): Promise<Array<IRole>>;

	private hasReadPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.role.read)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.role.read],
			}),
		);

		return false;
	}
}
