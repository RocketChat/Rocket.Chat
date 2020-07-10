import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	if ('serviceWorker' in navigator) {
		// Register the service worker
		navigator.serviceWorker
			.register('sw.js', {
				scope: './',
			})
			.then(function(reg) {
				if (reg.installing) {
					const sw = reg.installing || reg.waiting;
					sw.onstatechange = function() {
						if (sw.state === 'installed') {
							// SW installed. Reload page.
							window.location.reload();
						}
					};
				}
				console.log(`Service worker has been registered for scope: ${ reg.scope }`);
			});
	}
});
