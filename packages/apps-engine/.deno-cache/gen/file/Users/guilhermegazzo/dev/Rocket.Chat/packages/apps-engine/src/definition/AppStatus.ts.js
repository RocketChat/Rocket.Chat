export var AppStatus = /*#__PURE__*/ function(AppStatus) {
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
  return AppStatus;
}({});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9kZWZpbml0aW9uL0FwcFN0YXR1cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBBcHBTdGF0dXMge1xuXHQvKiogVGhlIHN0YXR1cyBpcyBrbm93biwgYWthIG5vdCBiZWVuIGNvbnN0cnVjdGVkIHRoZSBwcm9wZXIgd2F5LiAqL1xuXHRVTktOT1dOID0gJ3Vua25vd24nLFxuXHQvKiogVGhlIEFwcCBoYXMgYmVlbiBjb25zdHJ1Y3RlZCBidXQgdGhhdCdzIGl0LiAqL1xuXHRDT05TVFJVQ1RFRCA9ICdjb25zdHJ1Y3RlZCcsXG5cdC8qKiBUaGUgQXBwJ3MgYGluaXRpYWxpemUoKWAgd2FzIGNhbGxlZCBhbmQgcmV0dXJuZWQgdHJ1ZS4gKi9cblx0SU5JVElBTElaRUQgPSAnaW5pdGlhbGl6ZWQnLFxuXHQvKiogVGhlIEFwcCdzIGBvbkVuYWJsZSgpYCB3YXMgY2FsbGVkLCByZXR1cm5lZCB0cnVlLCBhbmQgdGhpcyB3YXMgZG9uZSBhdXRvbWF0aWNhbGx5IChzeXN0ZW0gc3RhcnQgdXApLiAqL1xuXHRBVVRPX0VOQUJMRUQgPSAnYXV0b19lbmFibGVkJyxcblx0LyoqIFRoZSBBcHAncyBgb25FbmFibGUoKWAgd2FzIGNhbGxlZCwgcmV0dXJuZWQgdHJ1ZSwgYW5kIHRoaXMgd2FzIGRvbmUgYnkgdGhlIHVzZXIgc3VjaCBhcyBpbnN0YWxsaW5nIGEgbmV3IG9uZS4gKi9cblx0TUFOVUFMTFlfRU5BQkxFRCA9ICdtYW51YWxseV9lbmFibGVkJyxcblx0LyoqXG5cdCAqIFRoZSBBcHAgd2FzIGRpc2FibGVkIGR1ZSB0byBhbiBlcnJvciB3aGlsZSBhdHRlbXB0aW5nIHRvIGNvbXBpbGUgaXQuXG5cdCAqIEFuIGF0dGVtcHQgdG8gZW5hYmxlIGl0IGFnYWluIHdpbGwgZmFpbCwgYXMgaXQgbmVlZHMgdG8gYmUgdXBkYXRlZC5cblx0ICovXG5cdENPTVBJTEVSX0VSUk9SX0RJU0FCTEVEID0gJ2NvbXBpbGVyX2Vycm9yX2Rpc2FibGVkJyxcblx0LyoqXG5cdCAqIFRoZSBBcHAgd2FzIGRpc2FibGUgZHVlIHRvIGl0cyBsaWNlbnNlIGJlaW5nIGludmFsaWRcblx0ICovXG5cdElOVkFMSURfTElDRU5TRV9ESVNBQkxFRCA9ICdpbnZhbGlkX2xpY2Vuc2VfZGlzYWJsZWQnLFxuXHQvKipcblx0ICogVGhlIGFwcCB3YXMgZGlzYWJsZWQgZHVlIHRvIGFuIGludmFsaWQgaW5zdGFsbGF0aW9uIG9yIHZhbGlkYXRpb24gaW4gaXRzIHNpZ25hdHVyZS5cblx0ICovXG5cdElOVkFMSURfSU5TVEFMTEFUSU9OX0RJU0FCTEVEID0gJ2ludmFsaWRfaW5zdGFsbGF0aW9uX2Rpc2FibGVkJyxcblx0LyoqIFRoZSBBcHAgd2FzIGRpc2FibGVkIGR1ZSB0byBhbiB1bnJlY292ZXJhYmxlIGVycm9yIGJlaW5nIHRocm93bi4gKi9cblx0RVJST1JfRElTQUJMRUQgPSAnZXJyb3JfZGlzYWJsZWQnLFxuXHQvKiogVGhlIEFwcCB3YXMgbWFudWFsbHkgZGlzYWJsZWQgYnkgYSB1c2VyLiAqL1xuXHRNQU5VQUxMWV9ESVNBQkxFRCA9ICdtYW51YWxseV9kaXNhYmxlZCcsXG5cdElOVkFMSURfU0VUVElOR1NfRElTQUJMRUQgPSAnaW52YWxpZF9zZXR0aW5nc19kaXNhYmxlZCcsXG5cdC8qKiBUaGUgQXBwIHdhcyBkaXNhYmxlZCBkdWUgdG8gb3RoZXIgY2lyY3Vtc3RhbmNlcy4gKi9cblx0RElTQUJMRUQgPSAnZGlzYWJsZWQnLFxufVxuXG5leHBvcnQgY2xhc3MgQXBwU3RhdHVzVXRpbHNEZWYge1xuXHRwdWJsaWMgaXNFbmFibGVkKHN0YXR1czogQXBwU3RhdHVzKTogYm9vbGVhbiB7XG5cdFx0c3dpdGNoIChzdGF0dXMpIHtcblx0XHRcdGNhc2UgQXBwU3RhdHVzLkFVVE9fRU5BQkxFRDpcblx0XHRcdGNhc2UgQXBwU3RhdHVzLk1BTlVBTExZX0VOQUJMRUQ6XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBpc0Rpc2FibGVkKHN0YXR1czogQXBwU3RhdHVzKTogYm9vbGVhbiB7XG5cdFx0c3dpdGNoIChzdGF0dXMpIHtcblx0XHRcdGNhc2UgQXBwU3RhdHVzLkNPTVBJTEVSX0VSUk9SX0RJU0FCTEVEOlxuXHRcdFx0Y2FzZSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ6XG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRDpcblx0XHRcdGNhc2UgQXBwU3RhdHVzLklOVkFMSURfU0VUVElOR1NfRElTQUJMRUQ6XG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5JTlZBTElEX0xJQ0VOU0VfRElTQUJMRUQ6XG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5JTlZBTElEX0lOU1RBTExBVElPTl9ESVNBQkxFRDpcblx0XHRcdGNhc2UgQXBwU3RhdHVzLkRJU0FCTEVEOlxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgaXNFcnJvcihzdGF0dXM6IEFwcFN0YXR1cyk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBbQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVELCBBcHBTdGF0dXMuQ09NUElMRVJfRVJST1JfRElTQUJMRURdLmluY2x1ZGVzKHN0YXR1cyk7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IEFwcFN0YXR1c1V0aWxzID0gbmV3IEFwcFN0YXR1c1V0aWxzRGVmKCk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFBLEFBQUssbUNBQUE7RUFDWCxrRUFBa0U7RUFFbEUsZ0RBQWdEO0VBRWhELDJEQUEyRDtFQUUzRCx5R0FBeUc7RUFFekcsa0hBQWtIO0VBRWxIOzs7RUFHQztFQUVEOztFQUVDO0VBRUQ7O0VBRUM7RUFFRCxxRUFBcUU7RUFFckUsNkNBQTZDOztFQUc3QyxxREFBcUQ7U0E3QjFDO01BK0JYO0FBRUQsT0FBTyxNQUFNO0VBQ0wsVUFBVSxNQUFpQixFQUFXO0lBQzVDLE9BQVE7TUFDUCxLQUFLLFVBQVUsWUFBWTtNQUMzQixLQUFLLFVBQVUsZ0JBQWdCO1FBQzlCLE9BQU87TUFDUjtRQUNDLE9BQU87SUFDVDtFQUNEO0VBRU8sV0FBVyxNQUFpQixFQUFXO0lBQzdDLE9BQVE7TUFDUCxLQUFLLFVBQVUsdUJBQXVCO01BQ3RDLEtBQUssVUFBVSxjQUFjO01BQzdCLEtBQUssVUFBVSxpQkFBaUI7TUFDaEMsS0FBSyxVQUFVLHlCQUF5QjtNQUN4QyxLQUFLLFVBQVUsd0JBQXdCO01BQ3ZDLEtBQUssVUFBVSw2QkFBNkI7TUFDNUMsS0FBSyxVQUFVLFFBQVE7UUFDdEIsT0FBTztNQUNSO1FBQ0MsT0FBTztJQUNUO0VBQ0Q7RUFFTyxRQUFRLE1BQWlCLEVBQVc7SUFDMUMsT0FBTztNQUFDLFVBQVUsY0FBYztNQUFFLFVBQVUsdUJBQXVCO0tBQUMsQ0FBQyxRQUFRLENBQUM7RUFDL0U7QUFDRDtBQUVBLE9BQU8sTUFBTSxpQkFBaUIsSUFBSSxvQkFBb0IifQ==
// denoCacheMetadata=15269838543296721442,67695596981443028