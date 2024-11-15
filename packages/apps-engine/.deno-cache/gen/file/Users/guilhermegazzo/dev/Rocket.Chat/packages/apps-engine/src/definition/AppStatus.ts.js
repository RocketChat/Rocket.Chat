export var AppStatus;
(function(AppStatus) {
  /** The status is known, aka not been constructed the proper way. */ AppStatus["UNKNOWN"] = "unknown";
  /** The App has been constructed but that's it. */ AppStatus["CONSTRUCTED"] = "constructed";
  /** The App's `initialize()` was called and returned true. */ AppStatus["INITIALIZED"] = "initialized";
  /** The App's `onEnable()` was called, returned true, and this was done automatically (system start up). */ AppStatus["AUTO_ENABLED"] = "auto_enabled";
  /** The App's `onEnable()` was called, returned true, and this was done by the user such as installing a new one. */ AppStatus["MANUALLY_ENABLED"] = "manually_enabled";
  /**
     * The App was disabled due to an error while attempting to compile it.
     * An attempt to enable it again will fail, as it needs to be updated.
     */ AppStatus["COMPILER_ERROR_DISABLED"] = "compiler_error_disabled";
  /**
     * The App was disable due to its license being invalid
     */ AppStatus["INVALID_LICENSE_DISABLED"] = "invalid_license_disabled";
  /**
     * The app was disabled due to an invalid installation or validation in its signature.
     */ AppStatus["INVALID_INSTALLATION_DISABLED"] = "invalid_installation_disabled";
  /** The App was disabled due to an unrecoverable error being thrown. */ AppStatus["ERROR_DISABLED"] = "error_disabled";
  /** The App was manually disabled by a user. */ AppStatus["MANUALLY_DISABLED"] = "manually_disabled";
  AppStatus["INVALID_SETTINGS_DISABLED"] = "invalid_settings_disabled";
  /** The App was disabled due to other circumstances. */ AppStatus["DISABLED"] = "disabled";
})(AppStatus || (AppStatus = {}));
export class AppStatusUtilsDef {
  isEnabled(status) {
    switch(status){
      case AppStatus.AUTO_ENABLED:
      case AppStatus.MANUALLY_ENABLED:
        return true;
      default:
        return false;
    }
  }
  isDisabled(status) {
    switch(status){
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
    return [
      AppStatus.ERROR_DISABLED,
      AppStatus.COMPILER_ERROR_DISABLED
    ].includes(status);
  }
}
export const AppStatusUtils = new AppStatusUtilsDef();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9kZWZpbml0aW9uL0FwcFN0YXR1cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBBcHBTdGF0dXMge1xuICAgIC8qKiBUaGUgc3RhdHVzIGlzIGtub3duLCBha2Egbm90IGJlZW4gY29uc3RydWN0ZWQgdGhlIHByb3BlciB3YXkuICovXG4gICAgVU5LTk9XTiA9ICd1bmtub3duJyxcbiAgICAvKiogVGhlIEFwcCBoYXMgYmVlbiBjb25zdHJ1Y3RlZCBidXQgdGhhdCdzIGl0LiAqL1xuICAgIENPTlNUUlVDVEVEID0gJ2NvbnN0cnVjdGVkJyxcbiAgICAvKiogVGhlIEFwcCdzIGBpbml0aWFsaXplKClgIHdhcyBjYWxsZWQgYW5kIHJldHVybmVkIHRydWUuICovXG4gICAgSU5JVElBTElaRUQgPSAnaW5pdGlhbGl6ZWQnLFxuICAgIC8qKiBUaGUgQXBwJ3MgYG9uRW5hYmxlKClgIHdhcyBjYWxsZWQsIHJldHVybmVkIHRydWUsIGFuZCB0aGlzIHdhcyBkb25lIGF1dG9tYXRpY2FsbHkgKHN5c3RlbSBzdGFydCB1cCkuICovXG4gICAgQVVUT19FTkFCTEVEID0gJ2F1dG9fZW5hYmxlZCcsXG4gICAgLyoqIFRoZSBBcHAncyBgb25FbmFibGUoKWAgd2FzIGNhbGxlZCwgcmV0dXJuZWQgdHJ1ZSwgYW5kIHRoaXMgd2FzIGRvbmUgYnkgdGhlIHVzZXIgc3VjaCBhcyBpbnN0YWxsaW5nIGEgbmV3IG9uZS4gKi9cbiAgICBNQU5VQUxMWV9FTkFCTEVEID0gJ21hbnVhbGx5X2VuYWJsZWQnLFxuICAgIC8qKlxuICAgICAqIFRoZSBBcHAgd2FzIGRpc2FibGVkIGR1ZSB0byBhbiBlcnJvciB3aGlsZSBhdHRlbXB0aW5nIHRvIGNvbXBpbGUgaXQuXG4gICAgICogQW4gYXR0ZW1wdCB0byBlbmFibGUgaXQgYWdhaW4gd2lsbCBmYWlsLCBhcyBpdCBuZWVkcyB0byBiZSB1cGRhdGVkLlxuICAgICAqL1xuICAgIENPTVBJTEVSX0VSUk9SX0RJU0FCTEVEID0gJ2NvbXBpbGVyX2Vycm9yX2Rpc2FibGVkJyxcbiAgICAvKipcbiAgICAgKiBUaGUgQXBwIHdhcyBkaXNhYmxlIGR1ZSB0byBpdHMgbGljZW5zZSBiZWluZyBpbnZhbGlkXG4gICAgICovXG4gICAgSU5WQUxJRF9MSUNFTlNFX0RJU0FCTEVEID0gJ2ludmFsaWRfbGljZW5zZV9kaXNhYmxlZCcsXG4gICAgLyoqXG4gICAgICogVGhlIGFwcCB3YXMgZGlzYWJsZWQgZHVlIHRvIGFuIGludmFsaWQgaW5zdGFsbGF0aW9uIG9yIHZhbGlkYXRpb24gaW4gaXRzIHNpZ25hdHVyZS5cbiAgICAgKi9cbiAgICBJTlZBTElEX0lOU1RBTExBVElPTl9ESVNBQkxFRCA9ICdpbnZhbGlkX2luc3RhbGxhdGlvbl9kaXNhYmxlZCcsXG4gICAgLyoqIFRoZSBBcHAgd2FzIGRpc2FibGVkIGR1ZSB0byBhbiB1bnJlY292ZXJhYmxlIGVycm9yIGJlaW5nIHRocm93bi4gKi9cbiAgICBFUlJPUl9ESVNBQkxFRCA9ICdlcnJvcl9kaXNhYmxlZCcsXG4gICAgLyoqIFRoZSBBcHAgd2FzIG1hbnVhbGx5IGRpc2FibGVkIGJ5IGEgdXNlci4gKi9cbiAgICBNQU5VQUxMWV9ESVNBQkxFRCA9ICdtYW51YWxseV9kaXNhYmxlZCcsXG4gICAgSU5WQUxJRF9TRVRUSU5HU19ESVNBQkxFRCA9ICdpbnZhbGlkX3NldHRpbmdzX2Rpc2FibGVkJyxcbiAgICAvKiogVGhlIEFwcCB3YXMgZGlzYWJsZWQgZHVlIHRvIG90aGVyIGNpcmN1bXN0YW5jZXMuICovXG4gICAgRElTQUJMRUQgPSAnZGlzYWJsZWQnLFxufVxuXG5leHBvcnQgY2xhc3MgQXBwU3RhdHVzVXRpbHNEZWYge1xuICAgIHB1YmxpYyBpc0VuYWJsZWQoc3RhdHVzOiBBcHBTdGF0dXMpOiBib29sZWFuIHtcbiAgICAgICAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICAgICAgICAgIGNhc2UgQXBwU3RhdHVzLkFVVE9fRU5BQkxFRDpcbiAgICAgICAgICAgIGNhc2UgQXBwU3RhdHVzLk1BTlVBTExZX0VOQUJMRUQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBpc0Rpc2FibGVkKHN0YXR1czogQXBwU3RhdHVzKTogYm9vbGVhbiB7XG4gICAgICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIEFwcFN0YXR1cy5DT01QSUxFUl9FUlJPUl9ESVNBQkxFRDpcbiAgICAgICAgICAgIGNhc2UgQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVEOlxuICAgICAgICAgICAgY2FzZSBBcHBTdGF0dXMuTUFOVUFMTFlfRElTQUJMRUQ6XG4gICAgICAgICAgICBjYXNlIEFwcFN0YXR1cy5JTlZBTElEX1NFVFRJTkdTX0RJU0FCTEVEOlxuICAgICAgICAgICAgY2FzZSBBcHBTdGF0dXMuSU5WQUxJRF9MSUNFTlNFX0RJU0FCTEVEOlxuICAgICAgICAgICAgY2FzZSBBcHBTdGF0dXMuSU5WQUxJRF9JTlNUQUxMQVRJT05fRElTQUJMRUQ6XG4gICAgICAgICAgICBjYXNlIEFwcFN0YXR1cy5ESVNBQkxFRDpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGlzRXJyb3Ioc3RhdHVzOiBBcHBTdGF0dXMpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIFtBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQsIEFwcFN0YXR1cy5DT01QSUxFUl9FUlJPUl9ESVNBQkxFRF0uaW5jbHVkZXMoc3RhdHVzKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBBcHBTdGF0dXNVdGlscyA9IG5ldyBBcHBTdGF0dXNVdGlsc0RlZigpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7VUFBWTtFQUNSLGtFQUFrRTtFQUVsRSxnREFBZ0Q7RUFFaEQsMkRBQTJEO0VBRTNELHlHQUF5RztFQUV6RyxrSEFBa0g7RUFFbEg7OztLQUdDO0VBRUQ7O0tBRUM7RUFFRDs7S0FFQztFQUVELHFFQUFxRTtFQUVyRSw2Q0FBNkM7O0VBRzdDLHFEQUFxRDtHQTdCN0MsY0FBQTtBQWlDWixPQUFPLE1BQU07RUFDRixVQUFVLE1BQWlCLEVBQVc7SUFDekMsT0FBUTtNQUNKLEtBQUssVUFBVSxZQUFZO01BQzNCLEtBQUssVUFBVSxnQkFBZ0I7UUFDM0IsT0FBTztNQUNYO1FBQ0ksT0FBTztJQUNmO0VBQ0o7RUFFTyxXQUFXLE1BQWlCLEVBQVc7SUFDMUMsT0FBUTtNQUNKLEtBQUssVUFBVSx1QkFBdUI7TUFDdEMsS0FBSyxVQUFVLGNBQWM7TUFDN0IsS0FBSyxVQUFVLGlCQUFpQjtNQUNoQyxLQUFLLFVBQVUseUJBQXlCO01BQ3hDLEtBQUssVUFBVSx3QkFBd0I7TUFDdkMsS0FBSyxVQUFVLDZCQUE2QjtNQUM1QyxLQUFLLFVBQVUsUUFBUTtRQUNuQixPQUFPO01BQ1g7UUFDSSxPQUFPO0lBQ2Y7RUFDSjtFQUVPLFFBQVEsTUFBaUIsRUFBVztJQUN2QyxPQUFPO01BQUMsVUFBVSxjQUFjO01BQUUsVUFBVSx1QkFBdUI7S0FBQyxDQUFDLFFBQVEsQ0FBQztFQUNsRjtBQUNKO0FBRUEsT0FBTyxNQUFNLGlCQUFpQixJQUFJLG9CQUFvQiJ9