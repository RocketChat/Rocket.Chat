import { Meteor } from 'meteor/meteor';

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
			const subscription = await reg.pushManager
				.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(
						'BCNirCnX-bsI7rf09_ADRWYT6aQC1TBZBVCMs-Of_B5mx_VNFIPY1nMRXtsODxhxFD3hcyuK_7-fQg20m1F4ius',
					),
				});
			await Meteor.call('savePushNotificationSubscription', JSON.stringify(subscription));
		});
	}
}

Meteor.startup(() => {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('sw.js', {
				scope: './',
			})
			.then(function(reg) {
				console.log(
					`Service worker has been registered for scope: ${reg.scope}`
				);
				reg.pushManager.getSubscription().then(function(sub) {
					if (sub === null) {
						// Update UI to ask user to register for Push
						console.log('Not subscribed to push service!');
						subscribeUser();
					} else {
						// We have a subscription, update the database
						console.log('Subscribed to push service');
					}
				});
			});
	}
});
