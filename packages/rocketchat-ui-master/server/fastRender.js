/* globals FastRender */

FastRender.onAllRoutes(function(/*path*/) {
	this.subscribe('settings');
	this.subscribe('meteor.loginServiceConfiguration');
});
