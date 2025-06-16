export enum AppDesiredStatus {
	/** The app should be enabled and running */
	ENABLED = 'enabled',
	/** The app should be disabled but still installed */
	DISABLED = 'disabled',
	/** The app should be uninstalled completely */
	UNINSTALLED = 'uninstalled',
}

export class AppDesiredStatusUtilsDef {
	public isEnabled(desiredStatus: AppDesiredStatus): boolean {
		return desiredStatus === AppDesiredStatus.ENABLED;
	}

	public isDisabled(desiredStatus: AppDesiredStatus): boolean {
		return desiredStatus === AppDesiredStatus.DISABLED;
	}

	public isUninstalled(desiredStatus: AppDesiredStatus): boolean {
		return desiredStatus === AppDesiredStatus.UNINSTALLED;
	}
}

export const AppDesiredStatusUtils = new AppDesiredStatusUtilsDef();