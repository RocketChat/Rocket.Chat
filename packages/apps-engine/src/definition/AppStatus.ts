/**
 * The point an App has reached in its lifecycle.
 *
 * Every value other than the enabled ones means the App is not running:
 * use {@link AppStatusUtils} instead of comparing against individual members.
 */
export enum AppStatus {
	/** The status is known, aka not been constructed the proper way. */
	UNKNOWN = 'unknown',
	/** The App has been constructed but that's it. */
	CONSTRUCTED = 'constructed',
	/** The App's `initialize()` was called and returned true. */
	INITIALIZED = 'initialized',
	/** The App's `onEnable()` was called, returned true, and this was done automatically (system start up). */
	AUTO_ENABLED = 'auto_enabled',
	/** The App's `onEnable()` was called, returned true, and this was done by the user such as installing a new one. */
	MANUALLY_ENABLED = 'manually_enabled',
	/**
	 * The App was disabled due to an error while attempting to compile it.
	 * An attempt to enable it again will fail, as it needs to be updated.
	 */
	COMPILER_ERROR_DISABLED = 'compiler_error_disabled',
	/**
	 * The App was disable due to its license being invalid
	 */
	INVALID_LICENSE_DISABLED = 'invalid_license_disabled',
	/**
	 * The app was disabled due to an invalid installation or validation in its signature.
	 */
	INVALID_INSTALLATION_DISABLED = 'invalid_installation_disabled',
	/** The App was disabled due to an unrecoverable error being thrown. */
	ERROR_DISABLED = 'error_disabled',
	/** The App was manually disabled by a user. */
	MANUALLY_DISABLED = 'manually_disabled',
	/** The App was disabled because one of its required settings has no valid value. */
	INVALID_SETTINGS_DISABLED = 'invalid_settings_disabled',
	/** The App was disabled due to other circumstances. */
	DISABLED = 'disabled',
}

/**
 * Groups the {@link AppStatus} members into the three questions callers actually ask.
 *
 * Use the {@link AppStatusUtils} singleton rather than instantiating this class.
 */
export class AppStatusUtilsDef {
	/** Whether the App is running, no matter who enabled it. */
	public isEnabled(status: AppStatus): boolean {
		switch (status) {
			case AppStatus.AUTO_ENABLED:
			case AppStatus.MANUALLY_ENABLED:
				return true;
			default:
				return false;
		}
	}

	/**
	 * Whether the App has been stopped for a known reason.
	 *
	 * A freshly constructed or initialized App is neither enabled nor disabled.
	 */
	public isDisabled(status: AppStatus): boolean {
		switch (status) {
			case AppStatus.COMPILER_ERROR_DISABLED:
			case AppStatus.ERROR_DISABLED:
			case AppStatus.MANUALLY_DISABLED:
			case AppStatus.INVALID_SETTINGS_DISABLED:
			case AppStatus.INVALID_LICENSE_DISABLED:
			case AppStatus.INVALID_INSTALLATION_DISABLED:
			case AppStatus.DISABLED:
				return true;
			default:
				return false;
		}
	}

	/** Whether the App was stopped by a failure, as opposed to a user or a license decision. */
	public isError(status: AppStatus): boolean {
		return [AppStatus.ERROR_DISABLED, AppStatus.COMPILER_ERROR_DISABLED].includes(status);
	}
}

/** The shared {@link AppStatusUtilsDef} instance. */
export const AppStatusUtils = new AppStatusUtilsDef();
