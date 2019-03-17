import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import { settings } from '../../../settings';
import _ from 'underscore';

function testWebAppInternals(fn) {
	typeof WebAppInternals !== 'undefined' && fn(WebAppInternals);
}
settings.onload('CDN_PREFIX', function(key, value) {
	const useForAll = settings.get('CDN_PREFIX_ALL');
	if (_.isString(value) && value.trim() && useForAll) {
		return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

settings.onload('CDN_JSCSS_PREFIX', function(key, value) {
	const useForAll = settings.get('CDN_PREFIX_ALL');
	if (_.isString(value) && value.trim() && !useForAll) {
		return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

Meteor.startup(function() {
	const cdnValue = settings.get('CDN_PREFIX');
	const useForAll = settings.get('CDN_PREFIX_ALL');
	const cdnJsCss = settings.get('CDN_JSCSS_PREFIX');
	if (_.isString(cdnValue) && cdnValue.trim()) {
		if (useForAll) {
			return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(cdnValue));
		} else if (_.isString(cdnJsCss) && cdnJsCss.trim()) {
			return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(cdnJsCss));
		}
	}
});
