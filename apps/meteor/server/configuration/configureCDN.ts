import { WebAppInternals } from 'meteor/webapp';

import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

export async function configureCDN(settings: ICachedSettings): Promise<void> {
	settings.change<string>('CDN_PREFIX', (value) => {
		const useForAll = settings.get('CDN_PREFIX_ALL');
		if (value && useForAll) {
			void WebAppInternals.setBundledJsCssPrefix(value);
		}
	});

	settings.change<string>('CDN_JSCSS_PREFIX', (value) => {
		const useForAll = settings.get('CDN_PREFIX_ALL');
		if (value && typeof value === 'string' && value.trim() && !useForAll) {
			void WebAppInternals.setBundledJsCssPrefix(value);
		}
	});

	const cdnValue = settings.get('CDN_PREFIX');
	const useForAll = settings.get('CDN_PREFIX_ALL');
	const cdnJsCss = settings.get('CDN_JSCSS_PREFIX');
	if (cdnValue && typeof cdnValue === 'string' && cdnValue.trim()) {
		if (useForAll) {
			await WebAppInternals.setBundledJsCssPrefix(cdnValue);
			return;
		}
		if (cdnJsCss && typeof cdnJsCss === 'string' && cdnJsCss.trim()) {
			await WebAppInternals.setBundledJsCssPrefix(cdnJsCss);
		}
	}
}
