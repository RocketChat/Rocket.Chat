export var ApiVisibility;
(function(ApiVisibility) {
  /**
     * A public Api has a fixed format for a url. Using it enables an
     * easy to remember structure, however, it also means the url is
     * intelligently guessed. As a result, we recommend having some
     * sort of security setup if you must have a public api.Whether
     * you use the provided security, ApiSecurity, or implement your own.
     * Url format:
     * `https://{your-server-address}/api/apps/public/{your-app-id}/{path}`
     */ ApiVisibility[ApiVisibility["PUBLIC"] = 0] = "PUBLIC";
  /**
     * Private Api's contain a random value in the url format,
     * making them harder go guess by default. The random value
     * will be generated whenever the App is installed on a server.
     * This means that the URL will not be the same on any server,
     * but will remain the same throughout the lifecycle of an App
     * including updates. As a result, if a user uninstalls the App
     * and reinstalls the App, then the random value will change.
     * Url format:
     * `https://{your-server-address}/api/apps/private/{your-app-id}/{random-hash}/{path}`
     */ ApiVisibility[ApiVisibility["PRIVATE"] = 1] = "PRIVATE";
})(ApiVisibility || (ApiVisibility = {}));
export var ApiSecurity;
(function(ApiSecurity) {
  /**
     * No security check will be executed agains the calls made to this URL
     */ ApiSecurity[ApiSecurity["UNSECURE"] = 0] = "UNSECURE";
})(ApiSecurity || (ApiSecurity = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9kZWZpbml0aW9uL2FwaS9JQXBpLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSUFwaUVuZHBvaW50IH0gZnJvbSAnLi9JQXBpRW5kcG9pbnQnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gYXBpIHRoYXQgaXMgYmVpbmcgcHJvdmlkZWQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSUFwaSB7XG4gICAgLyoqXG4gICAgICogUHJvdmlkZXMgdGhlIHZpc2liaWxpdHkgbWV0aG9kIG9mIHRoZSBVUkwsIHNlZSB0aGUgQXBpVmlzaWJpbGl0eSBkZXNjcmlwdGlvbnMgZm9yIG1vcmUgaW5mb3JtYXRpb25cbiAgICAgKi9cbiAgICB2aXNpYmlsaXR5OiBBcGlWaXNpYmlsaXR5O1xuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIHRoZSB2aXNpYmlsaXR5IG1ldGhvZCBvZiB0aGUgVVJMLCBzZWUgdGhlIEFwaVNlY3VyaXR5IGRlc2NyaXB0aW9ucyBmb3IgbW9yZSBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIHNlY3VyaXR5OiBBcGlTZWN1cml0eTtcbiAgICAvKipcbiAgICAgKiBQcm92aWRlIGVucG9pbnRzIGZvciB0aGlzIGFwaSByZWdpc3RyeVxuICAgICAqL1xuICAgIGVuZHBvaW50czogQXJyYXk8SUFwaUVuZHBvaW50Pjtcbn1cblxuZXhwb3J0IGVudW0gQXBpVmlzaWJpbGl0eSB7XG4gICAgLyoqXG4gICAgICogQSBwdWJsaWMgQXBpIGhhcyBhIGZpeGVkIGZvcm1hdCBmb3IgYSB1cmwuIFVzaW5nIGl0IGVuYWJsZXMgYW5cbiAgICAgKiBlYXN5IHRvIHJlbWVtYmVyIHN0cnVjdHVyZSwgaG93ZXZlciwgaXQgYWxzbyBtZWFucyB0aGUgdXJsIGlzXG4gICAgICogaW50ZWxsaWdlbnRseSBndWVzc2VkLiBBcyBhIHJlc3VsdCwgd2UgcmVjb21tZW5kIGhhdmluZyBzb21lXG4gICAgICogc29ydCBvZiBzZWN1cml0eSBzZXR1cCBpZiB5b3UgbXVzdCBoYXZlIGEgcHVibGljIGFwaS5XaGV0aGVyXG4gICAgICogeW91IHVzZSB0aGUgcHJvdmlkZWQgc2VjdXJpdHksIEFwaVNlY3VyaXR5LCBvciBpbXBsZW1lbnQgeW91ciBvd24uXG4gICAgICogVXJsIGZvcm1hdDpcbiAgICAgKiBgaHR0cHM6Ly97eW91ci1zZXJ2ZXItYWRkcmVzc30vYXBpL2FwcHMvcHVibGljL3t5b3VyLWFwcC1pZH0ve3BhdGh9YFxuICAgICAqL1xuICAgIFBVQkxJQyxcbiAgICAvKipcbiAgICAgKiBQcml2YXRlIEFwaSdzIGNvbnRhaW4gYSByYW5kb20gdmFsdWUgaW4gdGhlIHVybCBmb3JtYXQsXG4gICAgICogbWFraW5nIHRoZW0gaGFyZGVyIGdvIGd1ZXNzIGJ5IGRlZmF1bHQuIFRoZSByYW5kb20gdmFsdWVcbiAgICAgKiB3aWxsIGJlIGdlbmVyYXRlZCB3aGVuZXZlciB0aGUgQXBwIGlzIGluc3RhbGxlZCBvbiBhIHNlcnZlci5cbiAgICAgKiBUaGlzIG1lYW5zIHRoYXQgdGhlIFVSTCB3aWxsIG5vdCBiZSB0aGUgc2FtZSBvbiBhbnkgc2VydmVyLFxuICAgICAqIGJ1dCB3aWxsIHJlbWFpbiB0aGUgc2FtZSB0aHJvdWdob3V0IHRoZSBsaWZlY3ljbGUgb2YgYW4gQXBwXG4gICAgICogaW5jbHVkaW5nIHVwZGF0ZXMuIEFzIGEgcmVzdWx0LCBpZiBhIHVzZXIgdW5pbnN0YWxscyB0aGUgQXBwXG4gICAgICogYW5kIHJlaW5zdGFsbHMgdGhlIEFwcCwgdGhlbiB0aGUgcmFuZG9tIHZhbHVlIHdpbGwgY2hhbmdlLlxuICAgICAqIFVybCBmb3JtYXQ6XG4gICAgICogYGh0dHBzOi8ve3lvdXItc2VydmVyLWFkZHJlc3N9L2FwaS9hcHBzL3ByaXZhdGUve3lvdXItYXBwLWlkfS97cmFuZG9tLWhhc2h9L3twYXRofWBcbiAgICAgKi9cbiAgICBQUklWQVRFLFxufVxuXG5leHBvcnQgZW51bSBBcGlTZWN1cml0eSB7XG4gICAgLyoqXG4gICAgICogTm8gc2VjdXJpdHkgY2hlY2sgd2lsbCBiZSBleGVjdXRlZCBhZ2FpbnMgdGhlIGNhbGxzIG1hZGUgdG8gdGhpcyBVUkxcbiAgICAgKi9cbiAgICBVTlNFQ1VSRSxcbiAgICAvKipcbiAgICAgKiBPbmx5IGNhbGxzIGNvbnRhaW5pbmcgYSB2YWxpZCB0b2tlbiB3aWxsIGJlIGFibGUgdG8gZXhlY3V0ZSB0aGUgYXBpXG4gICAgICogTXV0aXBsZSB0b2tlbnMgY2FuIGJlIGdlbmVyYXRlZCB0byBhY2Nlc3MgdGhlIGFwaSwgYnkgZGVmYXVsdCBvbmVcbiAgICAgKiB3aWxsIGJlIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LlxuICAgICAqIEBwYXJhbSBgWC1BdXRoLVRva2VuYFxuICAgICAqL1xuICAgIC8vIENIRUNLU1VNX1NFQ1JFVCxcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO1VBb0JZO0VBQ1I7Ozs7Ozs7O0tBUUM7RUFFRDs7Ozs7Ozs7OztLQVVDO0dBckJPLGtCQUFBOztVQXlCQTtFQUNSOztLQUVDO0dBSE8sZ0JBQUEifQ==