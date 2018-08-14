/* globals WebAppInternals*/
import _ from 'underscore';

function testWebAppInternals(fn) {
	typeof WebAppInternals !== 'undefined' && fn(WebAppInternals);
}
RocketChat.settings.onload('CDN_PREFIX', function(key, value) {
	if (_.isString(value) && value.trim()) {
		return testWebAppInternals(WebAppInternals => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

Meteor.startup(function() {
	const value = RocketChat.settings.get('CDN_PREFIX');
	if (_.isString(value) && value.trim()) {
		return testWebAppInternals(WebAppInternals => WebAppInternals.setBundledJsCssPrefix(value));
	}
});
