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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9zcmMvZGVmaW5pdGlvbi9BcHBTdGF0dXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGVudW0gQXBwU3RhdHVzIHtcbiAgICAvKiogVGhlIHN0YXR1cyBpcyBrbm93biwgYWthIG5vdCBiZWVuIGNvbnN0cnVjdGVkIHRoZSBwcm9wZXIgd2F5LiAqL1xuICAgIFVOS05PV04gPSAndW5rbm93bicsXG4gICAgLyoqIFRoZSBBcHAgaGFzIGJlZW4gY29uc3RydWN0ZWQgYnV0IHRoYXQncyBpdC4gKi9cbiAgICBDT05TVFJVQ1RFRCA9ICdjb25zdHJ1Y3RlZCcsXG4gICAgLyoqIFRoZSBBcHAncyBgaW5pdGlhbGl6ZSgpYCB3YXMgY2FsbGVkIGFuZCByZXR1cm5lZCB0cnVlLiAqL1xuICAgIElOSVRJQUxJWkVEID0gJ2luaXRpYWxpemVkJyxcbiAgICAvKiogVGhlIEFwcCdzIGBvbkVuYWJsZSgpYCB3YXMgY2FsbGVkLCByZXR1cm5lZCB0cnVlLCBhbmQgdGhpcyB3YXMgZG9uZSBhdXRvbWF0aWNhbGx5IChzeXN0ZW0gc3RhcnQgdXApLiAqL1xuICAgIEFVVE9fRU5BQkxFRCA9ICdhdXRvX2VuYWJsZWQnLFxuICAgIC8qKiBUaGUgQXBwJ3MgYG9uRW5hYmxlKClgIHdhcyBjYWxsZWQsIHJldHVybmVkIHRydWUsIGFuZCB0aGlzIHdhcyBkb25lIGJ5IHRoZSB1c2VyIHN1Y2ggYXMgaW5zdGFsbGluZyBhIG5ldyBvbmUuICovXG4gICAgTUFOVUFMTFlfRU5BQkxFRCA9ICdtYW51YWxseV9lbmFibGVkJyxcbiAgICAvKipcbiAgICAgKiBUaGUgQXBwIHdhcyBkaXNhYmxlZCBkdWUgdG8gYW4gZXJyb3Igd2hpbGUgYXR0ZW1wdGluZyB0byBjb21waWxlIGl0LlxuICAgICAqIEFuIGF0dGVtcHQgdG8gZW5hYmxlIGl0IGFnYWluIHdpbGwgZmFpbCwgYXMgaXQgbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAgICAgKi9cbiAgICBDT01QSUxFUl9FUlJPUl9ESVNBQkxFRCA9ICdjb21waWxlcl9lcnJvcl9kaXNhYmxlZCcsXG4gICAgLyoqXG4gICAgICogVGhlIEFwcCB3YXMgZGlzYWJsZSBkdWUgdG8gaXRzIGxpY2Vuc2UgYmVpbmcgaW52YWxpZFxuICAgICAqL1xuICAgIElOVkFMSURfTElDRU5TRV9ESVNBQkxFRCA9ICdpbnZhbGlkX2xpY2Vuc2VfZGlzYWJsZWQnLFxuICAgIC8qKlxuICAgICAqIFRoZSBhcHAgd2FzIGRpc2FibGVkIGR1ZSB0byBhbiBpbnZhbGlkIGluc3RhbGxhdGlvbiBvciB2YWxpZGF0aW9uIGluIGl0cyBzaWduYXR1cmUuXG4gICAgICovXG4gICAgSU5WQUxJRF9JTlNUQUxMQVRJT05fRElTQUJMRUQgPSAnaW52YWxpZF9pbnN0YWxsYXRpb25fZGlzYWJsZWQnLFxuICAgIC8qKiBUaGUgQXBwIHdhcyBkaXNhYmxlZCBkdWUgdG8gYW4gdW5yZWNvdmVyYWJsZSBlcnJvciBiZWluZyB0aHJvd24uICovXG4gICAgRVJST1JfRElTQUJMRUQgPSAnZXJyb3JfZGlzYWJsZWQnLFxuICAgIC8qKiBUaGUgQXBwIHdhcyBtYW51YWxseSBkaXNhYmxlZCBieSBhIHVzZXIuICovXG4gICAgTUFOVUFMTFlfRElTQUJMRUQgPSAnbWFudWFsbHlfZGlzYWJsZWQnLFxuICAgIElOVkFMSURfU0VUVElOR1NfRElTQUJMRUQgPSAnaW52YWxpZF9zZXR0aW5nc19kaXNhYmxlZCcsXG4gICAgLyoqIFRoZSBBcHAgd2FzIGRpc2FibGVkIGR1ZSB0byBvdGhlciBjaXJjdW1zdGFuY2VzLiAqL1xuICAgIERJU0FCTEVEID0gJ2Rpc2FibGVkJyxcbn1cblxuZXhwb3J0IGNsYXNzIEFwcFN0YXR1c1V0aWxzRGVmIHtcbiAgICBwdWJsaWMgaXNFbmFibGVkKHN0YXR1czogQXBwU3RhdHVzKTogYm9vbGVhbiB7XG4gICAgICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIEFwcFN0YXR1cy5BVVRPX0VOQUJMRUQ6XG4gICAgICAgICAgICBjYXNlIEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEOlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgaXNEaXNhYmxlZChzdGF0dXM6IEFwcFN0YXR1cyk6IGJvb2xlYW4ge1xuICAgICAgICBzd2l0Y2ggKHN0YXR1cykge1xuICAgICAgICAgICAgY2FzZSBBcHBTdGF0dXMuQ09NUElMRVJfRVJST1JfRElTQUJMRUQ6XG4gICAgICAgICAgICBjYXNlIEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDpcbiAgICAgICAgICAgIGNhc2UgQXBwU3RhdHVzLk1BTlVBTExZX0RJU0FCTEVEOlxuICAgICAgICAgICAgY2FzZSBBcHBTdGF0dXMuSU5WQUxJRF9TRVRUSU5HU19ESVNBQkxFRDpcbiAgICAgICAgICAgIGNhc2UgQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRDpcbiAgICAgICAgICAgIGNhc2UgQXBwU3RhdHVzLklOVkFMSURfSU5TVEFMTEFUSU9OX0RJU0FCTEVEOlxuICAgICAgICAgICAgY2FzZSBBcHBTdGF0dXMuRElTQUJMRUQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBpc0Vycm9yKHN0YXR1czogQXBwU3RhdHVzKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBbQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVELCBBcHBTdGF0dXMuQ09NUElMRVJfRVJST1JfRElTQUJMRURdLmluY2x1ZGVzKHN0YXR1cyk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgQXBwU3RhdHVzVXRpbHMgPSBuZXcgQXBwU3RhdHVzVXRpbHNEZWYoKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO1VBQVk7RUFDUixrRUFBa0U7RUFFbEUsZ0RBQWdEO0VBRWhELDJEQUEyRDtFQUUzRCx5R0FBeUc7RUFFekcsa0hBQWtIO0VBRWxIOzs7S0FHQztFQUVEOztLQUVDO0VBRUQ7O0tBRUM7RUFFRCxxRUFBcUU7RUFFckUsNkNBQTZDOztFQUc3QyxxREFBcUQ7R0E3QjdDLGNBQUE7QUFpQ1osT0FBTyxNQUFNO0VBQ0YsVUFBVSxNQUFpQixFQUFXO0lBQ3pDLE9BQVE7TUFDSixLQUFLLFVBQVUsWUFBWTtNQUMzQixLQUFLLFVBQVUsZ0JBQWdCO1FBQzNCLE9BQU87TUFDWDtRQUNJLE9BQU87SUFDZjtFQUNKO0VBRU8sV0FBVyxNQUFpQixFQUFXO0lBQzFDLE9BQVE7TUFDSixLQUFLLFVBQVUsdUJBQXVCO01BQ3RDLEtBQUssVUFBVSxjQUFjO01BQzdCLEtBQUssVUFBVSxpQkFBaUI7TUFDaEMsS0FBSyxVQUFVLHlCQUF5QjtNQUN4QyxLQUFLLFVBQVUsd0JBQXdCO01BQ3ZDLEtBQUssVUFBVSw2QkFBNkI7TUFDNUMsS0FBSyxVQUFVLFFBQVE7UUFDbkIsT0FBTztNQUNYO1FBQ0ksT0FBTztJQUNmO0VBQ0o7RUFFTyxRQUFRLE1BQWlCLEVBQVc7SUFDdkMsT0FBTztNQUFDLFVBQVUsY0FBYztNQUFFLFVBQVUsdUJBQXVCO0tBQUMsQ0FBQyxRQUFRLENBQUM7RUFDbEY7QUFDSjtBQUVBLE9BQU8sTUFBTSxpQkFBaUIsSUFBSSxvQkFBb0IifQ==