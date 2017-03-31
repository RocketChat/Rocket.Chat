Template.body.onRendered(() => {
	Tracker.autorun((c) => {
		const piwikUrl = RocketChat.settings.get('PiwikAnalytics_enabled') && RocketChat.settings.get('PiwikAnalytics_url');
		const piwikSiteId = piwikUrl && RocketChat.settings.get('PiwikAnalytics_siteId');
		const googleId = RocketChat.settings.get('GoogleAnalytics_enabled') && RocketChat.settings.get('GoogleAnalytics_ID');
		if (piwikSiteId || googleId) {
			c.stop();

			if (piwikSiteId) {
				window._paq = window._paq || [];
				if (Meteor.userId()) {
					window._paq.push(['setUserId', Meteor.userId()]);
				}

				window._paq.push(['trackPageView']);
				window._paq.push(['enableLinkTracking']);
				(() => {
					window._paq.push(['setTrackerUrl', `${ piwikUrl }piwik.php`]);
					window._paq.push(['setSiteId', Number.parseInt(piwikSiteId)]);
					const d = document;
					const g = d.createElement('script');
					const s = d.getElementsByTagName('script')[0];
					g.type = 'text/javascript';
					g.async = true;
					g.defer = true;
					g.src = `${ piwikUrl }piwik.js`;
					s.parentNode.insertBefore(g, s);
				})();
			}

			if (googleId) {
				/*eslint-disable */
			  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

			  ga('create', googleId, 'auto');
			  ga('send', 'pageview');
				/*eslint-enable */
			}
		}
	});
});
