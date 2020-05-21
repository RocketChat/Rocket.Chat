import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../app/settings';
import { handleError } from '../app/utils/client';

function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

function subscribeUser() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready.then(async function(reg) {
			try {
				const vapidKey = await settings.get('Vapid_public_key');
				const subscription = await reg.pushManager
					.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(vapidKey),
					});
				Meteor.call('savePushNotificationSubscription', JSON.stringify(subscription));
			}
			catch (e) {
				handleError(e);
			}
		});
	}
}

Meteor.startup(() => {
	Tracker.autorun((computation) => {
		const settingsReady = settings.cachedCollection.ready.get();
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('sw.js', {
					scope: './',
				})
				.then(function(reg) {
					reg.pushManager.getSubscription().then(function(sub) {
						if (sub === null) {
							// Update UI to ask user to register for Push
							console.log('Not subscribed to push service!');
							if (settingsReady) {
								subscribeUser();
								computation.stop();
							}
						} else {
							// We have a subscription, update the database
							console.log('Subscribed to push service');
							computation.stop();
						}
					});
				});
		}
	});
});
