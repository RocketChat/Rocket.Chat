import { AppStatusUtils } from '../../definition/AppStatus';
import type { IUIActionButton, IUIActionButtonDescriptor } from '../../definition/ui';
import type { AppManager } from '../AppManager';
import type { AppActivationBridge } from '../bridges';
import { AppPermissionManager } from './AppPermissionManager';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissions } from '../permissions/AppPermissions';

export class UIActionButtonManager {
	private readonly activationBridge: AppActivationBridge;

	private readonly manager: AppManager;

	private registeredActionButtons = new Map<string, Map<string, IUIActionButtonDescriptor>>();

	constructor(manager: AppManager) {
		this.manager = manager;
		this.activationBridge = manager.getBridges().getAppActivationBridge();
	}

	public registerActionButton(appId: string, button: IUIActionButtonDescriptor) {
		if (!this.hasPermission(appId)) {
			return false;
		}

		if (!this.registeredActionButtons.has(appId)) {
			this.registeredActionButtons.set(appId, new Map());
		}

		this.registeredActionButtons.get(appId).set(button.actionId, button);

		this.activationBridge.doActionsChanged();

		return true;
	}

	public clearAppActionButtons(appId: string) {
		this.registeredActionButtons.set(appId, new Map());
		this.activationBridge.doActionsChanged();
	}

	public getAppActionButtons(appId: string) {
		return this.registeredActionButtons.get(appId);
	}

	public async getAllActionButtons(): Promise<Array<IUIActionButton>> {
		const buttonList: Array<IUIActionButton> = [];

		// Flatten map to a simple list of buttons from enabled apps only
		for (const [appId, appButtons] of this.registeredActionButtons) {
			const app = this.manager.getOneById(appId);

			// Skip if app doesn't exist
			if (!app) {
				continue;
			}

			// or if it is not enabled
			try {
				const appStatus = await app.getStatus();
				if (!AppStatusUtils.isEnabled(appStatus)) {
					continue;
				}
			} catch (error) {
				// If we can't get the app status, skip this app's buttons
				continue;
			}

			// Add buttons from this enabled app
			appButtons.forEach((button) =>
				buttonList.push({
					...button,
					appId,
				}),
			);
		}

		return buttonList;
	}

	private hasPermission(appId: string) {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.ui.registerButtons)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.ui.registerButtons],
			}),
		);

		return false;
	}
}
