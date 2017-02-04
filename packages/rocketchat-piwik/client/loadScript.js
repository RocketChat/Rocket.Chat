Template.body.onRendered(() => {
	Tracker.autorun((c) => {
		const url = RocketChat.settings.get('PiwikAnalytics_url');
		const siteId = RocketChat.settings.get('PiwikAnalytics_siteId');

		if (Match.test(url, String) && url.trim() !== '' && Match.test(siteId, String) && siteId.trim() !== '') {
			c.stop();
			window._paq = window._paq || [];
			if (Meteor.userId()) {
				window._paq.push(['setUserId', Meteor.userId()]);
			}

			window._paq.push(['trackPageView']);
			window._paq.push(['enableLinkTracking']);
			(() => {
				window._paq.push(['setTrackerUrl', url + 'piwik.php']);
				window._paq.push(['setSiteId', Number.parseInt(siteId)]);
				const d = document;
				const g = d.createElement('script');
				const s = d.getElementsByTagName('script')[0];
				g.type = 'text/javascript';
				g.async = true;
				g.defer = true;
				g.src = url + 'piwik.js';
				s.parentNode.insertBefore(g, s);
			})();
		}
	});
});
