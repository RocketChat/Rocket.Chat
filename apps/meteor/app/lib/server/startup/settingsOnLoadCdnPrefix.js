import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import _ from 'underscore';

import { settings } from '../../../settings/server';

function testWebAppInternals(fn) {
	typeof WebAppInternals !== 'undefined' && fn(WebAppInternals);
}
settings.change('CDN_PREFIX', function (value) {
	const useForAll = settings.get('CDN_PREFIX_ALL');
	if (_.isString(value) && value.trim() && useForAll) {
		return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

settings.change('CDN_JSCSS_PREFIX', function (value) {
	const useForAll = settings.get('CDN_PREFIX_ALL');
	if (_.isString(value) && value.trim() && !useForAll) {
		return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

Meteor.startup(function () {
	const cdnValue = settings.get('CDN_PREFIX');
	const useForAll = settings.get('CDN_PREFIX_ALL');
	const cdnJsCss = settings.get('CDN_JSCSS_PREFIX');
	if (_.isString(cdnValue) && cdnValue.trim()) {
		if (useForAll) {
			return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(cdnValue));
		}
		if (_.isString(cdnJsCss) && cdnJsCss.trim()) {
			return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(cdnJsCss));
		}
	}
});
