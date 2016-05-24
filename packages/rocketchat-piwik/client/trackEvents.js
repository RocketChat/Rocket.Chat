//Trigger the trackPageView manually as the page views don't seem to be tracked
FlowRouter.triggers.enter([function updatePiwik(route) {
	if (window._paq) {
		let http = location.protocol;
		let slashes = http.concat('//');
		let host = slashes.concat(window.location.hostname);

		window._paq.push(['setCustomUrl', host + route.path]);
		window._paq.push(['trackPageView']);
	}
}]);

//Custom events
RocketChat.callbacks.add('afterSaveMessage', (message) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_messages')) {
		window._paq.push(['trackEvent', 'Message', 'Send', ChatRoom.findOne({ _id: message.rid }).name ]);
	}
}, 2000);

RocketChat.callbacks.add('afterCreateChannel', (channel) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_rooms')) {
		window._paq.push(['trackEvent', 'Room', 'Create', channel.name]);
	}
});
