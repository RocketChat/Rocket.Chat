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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9zcmMvZGVmaW5pdGlvbi9hcGkvSUFwaS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElBcGlFbmRwb2ludCB9IGZyb20gJy4vSUFwaUVuZHBvaW50JztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGFwaSB0aGF0IGlzIGJlaW5nIHByb3ZpZGVkLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIElBcGkge1xuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIHRoZSB2aXNpYmlsaXR5IG1ldGhvZCBvZiB0aGUgVVJMLCBzZWUgdGhlIEFwaVZpc2liaWxpdHkgZGVzY3JpcHRpb25zIGZvciBtb3JlIGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgdmlzaWJpbGl0eTogQXBpVmlzaWJpbGl0eTtcbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyB0aGUgdmlzaWJpbGl0eSBtZXRob2Qgb2YgdGhlIFVSTCwgc2VlIHRoZSBBcGlTZWN1cml0eSBkZXNjcmlwdGlvbnMgZm9yIG1vcmUgaW5mb3JtYXRpb25cbiAgICAgKi9cbiAgICBzZWN1cml0eTogQXBpU2VjdXJpdHk7XG4gICAgLyoqXG4gICAgICogUHJvdmlkZSBlbnBvaW50cyBmb3IgdGhpcyBhcGkgcmVnaXN0cnlcbiAgICAgKi9cbiAgICBlbmRwb2ludHM6IEFycmF5PElBcGlFbmRwb2ludD47XG59XG5cbmV4cG9ydCBlbnVtIEFwaVZpc2liaWxpdHkge1xuICAgIC8qKlxuICAgICAqIEEgcHVibGljIEFwaSBoYXMgYSBmaXhlZCBmb3JtYXQgZm9yIGEgdXJsLiBVc2luZyBpdCBlbmFibGVzIGFuXG4gICAgICogZWFzeSB0byByZW1lbWJlciBzdHJ1Y3R1cmUsIGhvd2V2ZXIsIGl0IGFsc28gbWVhbnMgdGhlIHVybCBpc1xuICAgICAqIGludGVsbGlnZW50bHkgZ3Vlc3NlZC4gQXMgYSByZXN1bHQsIHdlIHJlY29tbWVuZCBoYXZpbmcgc29tZVxuICAgICAqIHNvcnQgb2Ygc2VjdXJpdHkgc2V0dXAgaWYgeW91IG11c3QgaGF2ZSBhIHB1YmxpYyBhcGkuV2hldGhlclxuICAgICAqIHlvdSB1c2UgdGhlIHByb3ZpZGVkIHNlY3VyaXR5LCBBcGlTZWN1cml0eSwgb3IgaW1wbGVtZW50IHlvdXIgb3duLlxuICAgICAqIFVybCBmb3JtYXQ6XG4gICAgICogYGh0dHBzOi8ve3lvdXItc2VydmVyLWFkZHJlc3N9L2FwaS9hcHBzL3B1YmxpYy97eW91ci1hcHAtaWR9L3twYXRofWBcbiAgICAgKi9cbiAgICBQVUJMSUMsXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSBBcGkncyBjb250YWluIGEgcmFuZG9tIHZhbHVlIGluIHRoZSB1cmwgZm9ybWF0LFxuICAgICAqIG1ha2luZyB0aGVtIGhhcmRlciBnbyBndWVzcyBieSBkZWZhdWx0LiBUaGUgcmFuZG9tIHZhbHVlXG4gICAgICogd2lsbCBiZSBnZW5lcmF0ZWQgd2hlbmV2ZXIgdGhlIEFwcCBpcyBpbnN0YWxsZWQgb24gYSBzZXJ2ZXIuXG4gICAgICogVGhpcyBtZWFucyB0aGF0IHRoZSBVUkwgd2lsbCBub3QgYmUgdGhlIHNhbWUgb24gYW55IHNlcnZlcixcbiAgICAgKiBidXQgd2lsbCByZW1haW4gdGhlIHNhbWUgdGhyb3VnaG91dCB0aGUgbGlmZWN5Y2xlIG9mIGFuIEFwcFxuICAgICAqIGluY2x1ZGluZyB1cGRhdGVzLiBBcyBhIHJlc3VsdCwgaWYgYSB1c2VyIHVuaW5zdGFsbHMgdGhlIEFwcFxuICAgICAqIGFuZCByZWluc3RhbGxzIHRoZSBBcHAsIHRoZW4gdGhlIHJhbmRvbSB2YWx1ZSB3aWxsIGNoYW5nZS5cbiAgICAgKiBVcmwgZm9ybWF0OlxuICAgICAqIGBodHRwczovL3t5b3VyLXNlcnZlci1hZGRyZXNzfS9hcGkvYXBwcy9wcml2YXRlL3t5b3VyLWFwcC1pZH0ve3JhbmRvbS1oYXNofS97cGF0aH1gXG4gICAgICovXG4gICAgUFJJVkFURSxcbn1cblxuZXhwb3J0IGVudW0gQXBpU2VjdXJpdHkge1xuICAgIC8qKlxuICAgICAqIE5vIHNlY3VyaXR5IGNoZWNrIHdpbGwgYmUgZXhlY3V0ZWQgYWdhaW5zIHRoZSBjYWxscyBtYWRlIHRvIHRoaXMgVVJMXG4gICAgICovXG4gICAgVU5TRUNVUkUsXG4gICAgLyoqXG4gICAgICogT25seSBjYWxscyBjb250YWluaW5nIGEgdmFsaWQgdG9rZW4gd2lsbCBiZSBhYmxlIHRvIGV4ZWN1dGUgdGhlIGFwaVxuICAgICAqIE11dGlwbGUgdG9rZW5zIGNhbiBiZSBnZW5lcmF0ZWQgdG8gYWNjZXNzIHRoZSBhcGksIGJ5IGRlZmF1bHQgb25lXG4gICAgICogd2lsbCBiZSBnZW5lcmF0ZWQgYXV0b21hdGljYWxseS5cbiAgICAgKiBAcGFyYW0gYFgtQXV0aC1Ub2tlbmBcbiAgICAgKi9cbiAgICAvLyBDSEVDS1NVTV9TRUNSRVQsXG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtVQW9CWTtFQUNSOzs7Ozs7OztLQVFDO0VBRUQ7Ozs7Ozs7Ozs7S0FVQztHQXJCTyxrQkFBQTs7VUF5QkE7RUFDUjs7S0FFQztHQUhPLGdCQUFBIn0=