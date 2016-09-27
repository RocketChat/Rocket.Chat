self.addEventListener('install', function(event) {
	self.skipWaiting();
});

self.addEventListener('activate', function(event) {
});

self.addEventListener('push', function(event) {
});

self.addEventListener('notificationclick', function(event) {
	event.notification.close();
	event.waitUntil(
		clients.matchAll({
			type: "window"
		}).then(function(clientList) {
			if (clientList[0]) {
				return clientList[0].postMessage(event.action);
			}
		})
	);
}, false);
