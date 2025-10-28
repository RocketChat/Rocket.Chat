import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

/**
 * @description
 * Experimental bridge for experimental features.
 * Methods in this class are not guaranteed to be stable between updates as the
 * team evaluates the proper signature, underlying implementation and performance
 * impact of candidates for future APIs
 */
export abstract class ExperimentalBridge extends BaseBridge {
	/**
	 *
	 * Candidate bridge: User bridge
	 */
	public async doGetUserRoomIds(userId: string, appId: string): Promise<string[] | undefined> {
		if (this.hasPermission('getUserRoomIds', appId)) {
			return this.getUserRoomIds(userId, appId);
		}
	}

	protected abstract getUserRoomIds(userId: string, appId: string): Promise<string[] | undefined>;

	private hasPermission(feature: keyof typeof AppPermissions.experimental, appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.experimental[feature])) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.experimental[feature]],
			}),
		);

		return false;
	}
}
