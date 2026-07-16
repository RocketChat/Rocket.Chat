import type { IUIKitInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class UiInteractionBridge extends BaseBridge {
	public async doNotifyUser(user: IUser, interaction: IUIKitInteraction, appId: string): Promise<void> {
		if (this.hasInteractionPermission(appId)) {
			return this.notifyUser(user, interaction, appId);
		}
	}

	public async doNotifyUserServerInitiated(user: IUser, interaction: IUIKitInteraction, appId: string): Promise<void> {
		if (this.hasServerInitiatedViewPermission(appId)) {
			return this.notifyUser(user, interaction, appId);
		}
	}

	protected abstract notifyUser(user: IUser, interaction: IUIKitInteraction, appId: string): Promise<void>;

	private hasServerInitiatedViewPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.ui.serverInitiatedView)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.ui.serverInitiatedView],
			}),
		);

		return false;
	}

	private hasInteractionPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.ui.interaction)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.ui.interaction],
			}),
		);

		return false;
	}
}
