import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('sw.js', {
				scope: './',
			})
			.then(function(reg) {
				console.log(`Service worker has been registered for scope: ${ reg.scope }`);
			});
	}
});
