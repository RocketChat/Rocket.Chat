import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { settings } from '../../settings/client';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		_paq: [string, ...unknown[]][];
		GoogleAnalyticsObject: unknown;
		ga: qa;
	}

	type qa = {
		(...args: unknown[]): void;
		l: number;
		q: unknown[];
	};
}

Template.body.onRendered(function () {
	this.autorun(() => {
		const uid = Meteor.userId();
		if (uid) {
			window._paq = window._paq || [];
			window._paq.push(['setUserId', uid]);
		}
	});

	this.autorun((c) => {
		const googleId = settings.get('GoogleAnalytics_enabled') && settings.get('GoogleAnalytics_ID');
		if (googleId) {
			c.stop();

			if (googleId) {
				/*eslint-disable */
				(function (i, s, o, g, r: 'ga', a?: any, m?: any) {
					i['GoogleAnalyticsObject'] = r;
					(i[r] =
						i[r] ||
						function () {
							(i[r].q = i[r].q || []).push(arguments);
						}),
						(i[r].l = new Date().getTime());
					(a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
					a.async = 1;
					a.src = g;
					m.parentNode.insertBefore(a, m);
				})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

				window.ga('create', googleId, 'auto');
				window.ga('send', 'pageview');
				/* eslint-enable */
			}
		}
	});

	this.autorun(() => {
		const piwikUrl = settings.get('PiwikAnalytics_enabled') && settings.get('PiwikAnalytics_url');

		if (!piwikUrl) {
			document.getElementById('piwik-analytics')?.remove();
			window._paq = [];
			return;
		}

		const piwikSiteId = piwikUrl && settings.get('PiwikAnalytics_siteId');
		const piwikPrependDomain = piwikUrl && settings.get('PiwikAnalytics_prependDomain');
		const piwikCookieDomain = piwikUrl && settings.get('PiwikAnalytics_cookieDomain');
		const piwikDomains = piwikUrl && settings.get('PiwikAnalytics_domains');
		const piwikAdditionalTracker = piwikUrl && settings.get('PiwikAdditionalTrackers');
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
	});
});
