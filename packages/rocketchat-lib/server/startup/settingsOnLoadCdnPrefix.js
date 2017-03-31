/* globals WebAppInternals*/
RocketChat.settings.onload('CDN_PREFIX', function(key, value) {
	if (_.isString(value || false)) {
		return typeof WebAppInternals !== 'undefined' && WebAppInternals !== null && WebAppInternals.setBundledJsCssPrefix(value);
	}
});

Meteor.startup(function() {
	const value = RocketChat.settings.get('CDN_PREFIX');
	if (_.isString(value || false)) {
		return typeof WebAppInternals !== 'undefined' && WebAppInternals !== null && WebAppInternals.setBundledJsCssPrefix(value);
	}
});
