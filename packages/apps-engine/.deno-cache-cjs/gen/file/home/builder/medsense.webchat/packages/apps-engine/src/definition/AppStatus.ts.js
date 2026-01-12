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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9idWlsZGVyL21lZHNlbnNlLndlYmNoYXQvcGFja2FnZXMvYXBwcy1lbmdpbmUvc3JjL2RlZmluaXRpb24vQXBwU3RhdHVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIEFwcFN0YXR1cyB7XHJcblx0LyoqIFRoZSBzdGF0dXMgaXMga25vd24sIGFrYSBub3QgYmVlbiBjb25zdHJ1Y3RlZCB0aGUgcHJvcGVyIHdheS4gKi9cclxuXHRVTktOT1dOID0gJ3Vua25vd24nLFxyXG5cdC8qKiBUaGUgQXBwIGhhcyBiZWVuIGNvbnN0cnVjdGVkIGJ1dCB0aGF0J3MgaXQuICovXHJcblx0Q09OU1RSVUNURUQgPSAnY29uc3RydWN0ZWQnLFxyXG5cdC8qKiBUaGUgQXBwJ3MgYGluaXRpYWxpemUoKWAgd2FzIGNhbGxlZCBhbmQgcmV0dXJuZWQgdHJ1ZS4gKi9cclxuXHRJTklUSUFMSVpFRCA9ICdpbml0aWFsaXplZCcsXHJcblx0LyoqIFRoZSBBcHAncyBgb25FbmFibGUoKWAgd2FzIGNhbGxlZCwgcmV0dXJuZWQgdHJ1ZSwgYW5kIHRoaXMgd2FzIGRvbmUgYXV0b21hdGljYWxseSAoc3lzdGVtIHN0YXJ0IHVwKS4gKi9cclxuXHRBVVRPX0VOQUJMRUQgPSAnYXV0b19lbmFibGVkJyxcclxuXHQvKiogVGhlIEFwcCdzIGBvbkVuYWJsZSgpYCB3YXMgY2FsbGVkLCByZXR1cm5lZCB0cnVlLCBhbmQgdGhpcyB3YXMgZG9uZSBieSB0aGUgdXNlciBzdWNoIGFzIGluc3RhbGxpbmcgYSBuZXcgb25lLiAqL1xyXG5cdE1BTlVBTExZX0VOQUJMRUQgPSAnbWFudWFsbHlfZW5hYmxlZCcsXHJcblx0LyoqXHJcblx0ICogVGhlIEFwcCB3YXMgZGlzYWJsZWQgZHVlIHRvIGFuIGVycm9yIHdoaWxlIGF0dGVtcHRpbmcgdG8gY29tcGlsZSBpdC5cclxuXHQgKiBBbiBhdHRlbXB0IHRvIGVuYWJsZSBpdCBhZ2FpbiB3aWxsIGZhaWwsIGFzIGl0IG5lZWRzIHRvIGJlIHVwZGF0ZWQuXHJcblx0ICovXHJcblx0Q09NUElMRVJfRVJST1JfRElTQUJMRUQgPSAnY29tcGlsZXJfZXJyb3JfZGlzYWJsZWQnLFxyXG5cdC8qKlxyXG5cdCAqIFRoZSBBcHAgd2FzIGRpc2FibGUgZHVlIHRvIGl0cyBsaWNlbnNlIGJlaW5nIGludmFsaWRcclxuXHQgKi9cclxuXHRJTlZBTElEX0xJQ0VOU0VfRElTQUJMRUQgPSAnaW52YWxpZF9saWNlbnNlX2Rpc2FibGVkJyxcclxuXHQvKipcclxuXHQgKiBUaGUgYXBwIHdhcyBkaXNhYmxlZCBkdWUgdG8gYW4gaW52YWxpZCBpbnN0YWxsYXRpb24gb3IgdmFsaWRhdGlvbiBpbiBpdHMgc2lnbmF0dXJlLlxyXG5cdCAqL1xyXG5cdElOVkFMSURfSU5TVEFMTEFUSU9OX0RJU0FCTEVEID0gJ2ludmFsaWRfaW5zdGFsbGF0aW9uX2Rpc2FibGVkJyxcclxuXHQvKiogVGhlIEFwcCB3YXMgZGlzYWJsZWQgZHVlIHRvIGFuIHVucmVjb3ZlcmFibGUgZXJyb3IgYmVpbmcgdGhyb3duLiAqL1xyXG5cdEVSUk9SX0RJU0FCTEVEID0gJ2Vycm9yX2Rpc2FibGVkJyxcclxuXHQvKiogVGhlIEFwcCB3YXMgbWFudWFsbHkgZGlzYWJsZWQgYnkgYSB1c2VyLiAqL1xyXG5cdE1BTlVBTExZX0RJU0FCTEVEID0gJ21hbnVhbGx5X2Rpc2FibGVkJyxcclxuXHRJTlZBTElEX1NFVFRJTkdTX0RJU0FCTEVEID0gJ2ludmFsaWRfc2V0dGluZ3NfZGlzYWJsZWQnLFxyXG5cdC8qKiBUaGUgQXBwIHdhcyBkaXNhYmxlZCBkdWUgdG8gb3RoZXIgY2lyY3Vtc3RhbmNlcy4gKi9cclxuXHRESVNBQkxFRCA9ICdkaXNhYmxlZCcsXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBcHBTdGF0dXNVdGlsc0RlZiB7XHJcblx0cHVibGljIGlzRW5hYmxlZChzdGF0dXM6IEFwcFN0YXR1cyk6IGJvb2xlYW4ge1xyXG5cdFx0c3dpdGNoIChzdGF0dXMpIHtcclxuXHRcdFx0Y2FzZSBBcHBTdGF0dXMuQVVUT19FTkFCTEVEOlxyXG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEOlxyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHB1YmxpYyBpc0Rpc2FibGVkKHN0YXR1czogQXBwU3RhdHVzKTogYm9vbGVhbiB7XHJcblx0XHRzd2l0Y2ggKHN0YXR1cykge1xyXG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5DT01QSUxFUl9FUlJPUl9ESVNBQkxFRDpcclxuXHRcdFx0Y2FzZSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ6XHJcblx0XHRcdGNhc2UgQXBwU3RhdHVzLk1BTlVBTExZX0RJU0FCTEVEOlxyXG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5JTlZBTElEX1NFVFRJTkdTX0RJU0FCTEVEOlxyXG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5JTlZBTElEX0xJQ0VOU0VfRElTQUJMRUQ6XHJcblx0XHRcdGNhc2UgQXBwU3RhdHVzLklOVkFMSURfSU5TVEFMTEFUSU9OX0RJU0FCTEVEOlxyXG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5ESVNBQkxFRDpcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgaXNFcnJvcihzdGF0dXM6IEFwcFN0YXR1cyk6IGJvb2xlYW4ge1xyXG5cdFx0cmV0dXJuIFtBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQsIEFwcFN0YXR1cy5DT01QSUxFUl9FUlJPUl9ESVNBQkxFRF0uaW5jbHVkZXMoc3RhdHVzKTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBBcHBTdGF0dXNVdGlscyA9IG5ldyBBcHBTdGF0dXNVdGlsc0RlZigpO1xyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFBLEFBQUssbUNBQUE7RUFDWCxrRUFBa0U7RUFFbEUsZ0RBQWdEO0VBRWhELDJEQUEyRDtFQUUzRCx5R0FBeUc7RUFFekcsa0hBQWtIO0VBRWxIOzs7RUFHQztFQUVEOztFQUVDO0VBRUQ7O0VBRUM7RUFFRCxxRUFBcUU7RUFFckUsNkNBQTZDOztFQUc3QyxxREFBcUQ7U0E3QjFDO01BK0JYO0FBRUQsT0FBTyxNQUFNO0VBQ0wsVUFBVSxNQUFpQixFQUFXO0lBQzVDLE9BQVE7TUFDUCxLQUFLLFVBQVUsWUFBWTtNQUMzQixLQUFLLFVBQVUsZ0JBQWdCO1FBQzlCLE9BQU87TUFDUjtRQUNDLE9BQU87SUFDVDtFQUNEO0VBRU8sV0FBVyxNQUFpQixFQUFXO0lBQzdDLE9BQVE7TUFDUCxLQUFLLFVBQVUsdUJBQXVCO01BQ3RDLEtBQUssVUFBVSxjQUFjO01BQzdCLEtBQUssVUFBVSxpQkFBaUI7TUFDaEMsS0FBSyxVQUFVLHlCQUF5QjtNQUN4QyxLQUFLLFVBQVUsd0JBQXdCO01BQ3ZDLEtBQUssVUFBVSw2QkFBNkI7TUFDNUMsS0FBSyxVQUFVLFFBQVE7UUFDdEIsT0FBTztNQUNSO1FBQ0MsT0FBTztJQUNUO0VBQ0Q7RUFFTyxRQUFRLE1BQWlCLEVBQVc7SUFDMUMsT0FBTztNQUFDLFVBQVUsY0FBYztNQUFFLFVBQVUsdUJBQXVCO0tBQUMsQ0FBQyxRQUFRLENBQUM7RUFDL0U7QUFDRDtBQUVBLE9BQU8sTUFBTSxpQkFBaUIsSUFBSSxvQkFBb0IifQ==
// denoCacheMetadata=14459221953369054508,8225131717150271999