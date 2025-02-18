export declare enum AppStatus {
    /** The status is known, aka not been constructed the proper way. */
    UNKNOWN = "unknown",
    /** The App has been constructed but that's it. */
    CONSTRUCTED = "constructed",
    /** The App's `initialize()` was called and returned true. */
    INITIALIZED = "initialized",
    /** The App's `onEnable()` was called, returned true, and this was done automatically (system start up). */
    AUTO_ENABLED = "auto_enabled",
    /** The App's `onEnable()` was called, returned true, and this was done by the user such as installing a new one. */
    MANUALLY_ENABLED = "manually_enabled",
    /**
     * The App was disabled due to an error while attempting to compile it.
     * An attempt to enable it again will fail, as it needs to be updated.
     */
    COMPILER_ERROR_DISABLED = "compiler_error_disabled",
    /**
     * The App was disable due to its license being invalid
     */
    INVALID_LICENSE_DISABLED = "invalid_license_disabled",
    /**
     * The app was disabled due to an invalid installation or validation in its signature.
     */
    INVALID_INSTALLATION_DISABLED = "invalid_installation_disabled",
    /** The App was disabled due to an unrecoverable error being thrown. */
    ERROR_DISABLED = "error_disabled",
    /** The App was manually disabled by a user. */
    MANUALLY_DISABLED = "manually_disabled",
    INVALID_SETTINGS_DISABLED = "invalid_settings_disabled",
    /** The App was disabled due to other circumstances. */
    DISABLED = "disabled"
}
export declare class AppStatusUtilsDef {
    isEnabled(status: AppStatus): boolean;
    isDisabled(status: AppStatus): boolean;
    isError(status: AppStatus): boolean;
}
export declare const AppStatusUtils: AppStatusUtilsDef;
