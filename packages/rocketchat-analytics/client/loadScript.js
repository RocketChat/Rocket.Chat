Template.body.onRendered(() => {
	Tracker.autorun((c) => {
		const piwikUrl = RocketChat.settings.get('PiwikAnalytics_enabled') && RocketChat.settings.get('PiwikAnalytics_url');
		const piwikSiteId = piwikUrl && RocketChat.settings.get('PiwikAnalytics_siteId');
		const piwikPrependDomain = piwikUrl && RocketChat.settings.get('PiwikAnalytics_prependDomain');
		const piwikCookieDomain = piwikUrl && RocketChat.settings.get('PiwikAnalytics_cookieDomain');
		const piwikDomains = piwikUrl && RocketChat.settings.get('PiwikAnalytics_domains');
		const piwikAdditionalTracker = piwikUrl && RocketChat.settings.get('PiwikAdditionalTrackers');
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
				if (piwikPrependDomain) {
					window._paq.push(['setDocumentTitle', `${ window.location.hostname }/${ document.title }`]);
				}
				const upperLevelDomain = `*.${ window.location.hostname.split('.').slice(1).join('.') }`;
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
							domains.push(`*.${ domainsArray[i].trim() }`);
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
								window._paq.push(['addTracker', `${ tracker['trackerURL'] }piwik.php`, tracker['siteId']]);
							}
						}
					} catch (e) {
						// parsing JSON faild
						console.log('Error while parsing JSON value of "piwikAdditionalTracker": ', e);
					}
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
