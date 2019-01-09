import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import _ from 'underscore';

function testWebAppInternals(fn) {
	typeof WebAppInternals !== 'undefined' && fn(WebAppInternals);
}
RocketChat.settings.onload('CDN_PREFIX', function(key, value) {
	const useForAll = RocketChat.settings.get('CDN_PREFIX_ALL');
	if (_.isString(value) && value.trim() && useForAll) {
		return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

RocketChat.settings.onload('CDN_JSCSS_PREFIX', function(key, value) {
	const useForAll = RocketChat.settings.get('CDN_PREFIX_ALL');
	if (_.isString(value) && value.trim() && !useForAll) {
		return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

Meteor.startup(function() {
	const cdnValue = RocketChat.settings.get('CDN_PREFIX');
	const useForAll = RocketChat.settings.get('CDN_PREFIX_ALL');
	const cdnJsCss = RocketChat.settings.get('CDN_JSCSS_PREFIX');
	if (_.isString(cdnValue) && cdnValue.trim()) {
		if (useForAll) {
			return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(cdnValue));
		} else if (_.isString(cdnJsCss) && cdnJsCss.trim()) {
			return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(cdnJsCss));
		}
	}
});
