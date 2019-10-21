import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	if ('serviceWorker' in navigator) {
	// if (navigator.serviceWorker.controller) {
	//	console.log('Active service worker found, no need to register');
	// } else {
		// Register the service worker
		navigator.serviceWorker
			.register('sw.js', {
				scope: './',
			})
			.then(function(reg) {
				console.log(`Service worker has been registered for scope: ${ reg.scope }`);
			});
	// }
	}
});
