import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		_paq?: [string, ...unknown[]][];
		GoogleAnalyticsObject: unknown;
		ga?: qa;
	}

	type qa = {
		(...args: unknown[]): void;
		l?: number;
		q?: unknown[];
	};
}

export const useAnalytics = (): void => {
	const uid = useUserId();

	const googleAnalyticsEnabled = useSetting('GoogleAnalytics_enabled', false);
	const googleId = useSetting('GoogleAnalytics_ID', '');

	const piwiEnabled = useSetting('PiwikAnalytics_enabled', false);
	const piwikUrl = useSetting('PiwikAnalytics_url', '');

	const piwikSiteId = useSetting('PiwikAnalytics_siteId', '');
	const piwikPrependDomain = useSetting('PiwikAnalytics_prependDomain', '');
	const piwikCookieDomain = useSetting('PiwikAnalytics_cookieDomain', '');
	const piwikDomains = useSetting('PiwikAnalytics_domains', '');
	const piwikAdditionalTracker = useSetting('PiwikAdditionalTrackers', '');

	useEffect(() => {
		if (uid) {
			window._paq = window._paq || [];
			window._paq.push(['setUserId', uid]);
		}
	}, [uid]);

	useEffect(() => {
		if (!googleAnalyticsEnabled || !googleId) {
			return;
		}
		if (googleId.startsWith('G-')) {
			// Google Analytics 4
			const f = document.getElementsByTagName('script')[0];
			const j = document.createElement('script');
			j.async = true;
			j.src = `//www.googletagmanager.com/gtag/js?id=${googleId}`;
			f.parentNode?.insertBefore(j, f);

			// injecting the dataLayer into the windows global object
			const w: Window & { dataLayer?: any } = window;
			const dataLayer = w.dataLayer || [];
			const gtag = (key: string, value: any) => {
				dataLayer.push(key, value);
			};
			gtag('js', new Date());
			gtag('config', googleId);
		} else {
			// Google Analytics 3
			(function (i, s, o, g, r: 'ga', a?: any, m?: any) {
				i.GoogleAnalyticsObject = r;
				(i[r] =
					i[r] ||
					function (...args) {
						((i[r] as any).q = (i[r] as any).q || []).push(args);
						// eslint-disable-next-line no-sequences
					}),
					((i[r] as any).l = new Date().getTime());
				// eslint-disable-next-line no-sequences
				(a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
				a.async = 1;
				a.src = g;
				m.parentNode.insertBefore(a, m);
			})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

			window.ga?.('create', googleId, 'auto');
			window.ga?.('send', 'pageview');
		}
	}, [googleAnalyticsEnabled, googleId, uid]);

	useEffect(() => {
		if (!piwiEnabled || !piwikUrl) {
			document.getElementById('piwik-analytics')?.remove();
			window._paq = [];
			return;
		}

		window._paq = window._paq || [];

		window._paq.push(['trackPageView']);
		window._paq.push(['enableLinkTracking']);
		if (piwikPrependDomain) {
			window._paq.push(['setDocumentTitle', `${window.location.hostname}/${document.title}`]);
		}
		const upperLevelDomain = `*.${window.location.hostname.split('.').slice(1).join('.')}`;
		if (piwikCookieDomain) {
			window._paq.push(['setCookieDomain', upperLevelDomain]);
		}
		if (piwikDomains) {
			// array
			const domainsArray = piwikDomains.split(/\n/);
			const domains = [];
			for (let i = 0; i < domainsArray.length; i++) {
				// only push domain if it contains a non whitespace character.
				if (/\S/.test(domainsArray[i])) {
					domains.push(`*.${domainsArray[i].trim()}`);
				}
			}
			window._paq.push(['setDomains', domains]);
		}
		(() => {
			try {
				if (/\S/.test(piwikAdditionalTracker)) {
					// piwikAdditionalTracker is not empty or whitespace only
					const addTrackers = JSON.parse(piwikAdditionalTracker);
					for (let i = 0; i < addTrackers.length; i++) {
						const tracker = addTrackers[i];
						window._paq.push(['addTracker', `${tracker.trackerURL}js/`, tracker.siteId]);
					}
				}
			} catch (e) {
				// parsing JSON faild
				console.log('Error while parsing JSON value of "piwikAdditionalTracker": ', e);
			}
			window._paq.push(['setTrackerUrl', `${piwikUrl}js/`]);
			window._paq.push(['setSiteId', Number.parseInt(piwikSiteId)]);
			const d = document;
			const g = d.createElement('script');
			g.setAttribute('id', 'piwik-analytics');
			const s = d.getElementsByTagName('script')[0];
			g.type = 'text/javascript';
			g.async = true;
			g.defer = true;
			g.src = `${piwikUrl}js/`;
			s.parentNode?.insertBefore(g, s);
		})();
	}, [piwiEnabled, piwikAdditionalTracker, piwikCookieDomain, piwikDomains, piwikPrependDomain, piwikSiteId, piwikUrl]);
};
