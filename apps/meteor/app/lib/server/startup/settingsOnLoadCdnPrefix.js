import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';

import { settings } from '../../../settings/server';

function testWebAppInternals(fn) {
	typeof WebAppInternals !== 'undefined' && fn(WebAppInternals);
}
settings.change('CDN_PREFIX', (value) => {
	const useForAll = settings.get('CDN_PREFIX_ALL');
	if (value && typeof value.valueOf() === 'string' && value.trim() && useForAll) {
		return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

settings.change('CDN_JSCSS_PREFIX', (value) => {
	const useForAll = settings.get('CDN_PREFIX_ALL');
	if (value && typeof value.valueOf() === 'string' && value.trim() && !useForAll) {
		return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(value));
	}
});

Meteor.startup(() => {
	const cdnValue = settings.get('CDN_PREFIX');
	const useForAll = settings.get('CDN_PREFIX_ALL');
	const cdnJsCss = settings.get('CDN_JSCSS_PREFIX');
	if (cdnValue && typeof cdnValue.valueOf() === 'string' && cdnValue.trim()) {
		if (useForAll) {
			return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(cdnValue));
		}
		if (cdnJsCss && typeof cdnJsCss.valueOf() === 'string' && cdnJsCss.trim()) {
			return testWebAppInternals((WebAppInternals) => WebAppInternals.setBundledJsCssPrefix(cdnJsCss));
		}
	}
});
