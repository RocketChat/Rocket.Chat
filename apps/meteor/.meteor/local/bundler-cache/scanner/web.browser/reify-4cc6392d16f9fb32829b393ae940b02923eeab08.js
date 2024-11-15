"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStatusUtils = exports.AppStatusUtilsDef = exports.AppStatus = void 0;
var AppStatus;
(function (AppStatus) {
    /** The status is known, aka not been constructed the proper way. */
    AppStatus["UNKNOWN"] = "unknown";
    /** The App has been constructed but that's it. */
    AppStatus["CONSTRUCTED"] = "constructed";
    /** The App's `initialize()` was called and returned true. */
    AppStatus["INITIALIZED"] = "initialized";
    /** The App's `onEnable()` was called, returned true, and this was done automatically (system start up). */
    AppStatus["AUTO_ENABLED"] = "auto_enabled";
    /** The App's `onEnable()` was called, returned true, and this was done by the user such as installing a new one. */
    AppStatus["MANUALLY_ENABLED"] = "manually_enabled";
    /**
     * The App was disabled due to an error while attempting to compile it.
     * An attempt to enable it again will fail, as it needs to be updated.
     */
    AppStatus["COMPILER_ERROR_DISABLED"] = "compiler_error_disabled";
    /**
     * The App was disable due to its license being invalid
     */
    AppStatus["INVALID_LICENSE_DISABLED"] = "invalid_license_disabled";
    /**
     * The app was disabled due to an invalid installation or validation in its signature.
     */
    AppStatus["INVALID_INSTALLATION_DISABLED"] = "invalid_installation_disabled";
    /** The App was disabled due to an unrecoverable error being thrown. */
    AppStatus["ERROR_DISABLED"] = "error_disabled";
    /** The App was manually disabled by a user. */
    AppStatus["MANUALLY_DISABLED"] = "manually_disabled";
    AppStatus["INVALID_SETTINGS_DISABLED"] = "invalid_settings_disabled";
    /** The App was disabled due to other circumstances. */
    AppStatus["DISABLED"] = "disabled";
})(AppStatus || (exports.AppStatus = AppStatus = {}));
class AppStatusUtilsDef {
    isEnabled(status) {
        switch (status) {
            case AppStatus.AUTO_ENABLED:
            case AppStatus.MANUALLY_ENABLED:
                return true;
            default:
                return false;
        }
    }
    isDisabled(status) {
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
    isError(status) {
        return [AppStatus.ERROR_DISABLED, AppStatus.COMPILER_ERROR_DISABLED].includes(status);
    }
}
exports.AppStatusUtilsDef = AppStatusUtilsDef;
exports.AppStatusUtils = new AppStatusUtilsDef();
//# sourceMappingURL=AppStatus.js.map