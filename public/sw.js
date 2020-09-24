const HTMLToCache = '/';
const version = 'viasat-0.1';

function removeHash(element) {
	if (typeof element === 'string') {
		return element.split('?hash=')[0];
	}
}

function hasHash(element) {
	if (typeof element === 'string') {
		return /\?hash=.*/.test(element);
	}
}

function hasSameHash(firstUrl, secondUrl) {
	if (typeof firstUrl === 'string' && typeof secondUrl === 'string') {
		return /\?hash=(.*)/.exec(firstUrl)[1] === /\?hash=(.*)/.exec(secondUrl)[1];
	}
}

function handleAvatar(request, response) {
	const clonedResponse = response.clone();
	const url = request.url.split('?')[0];
	caches.open(version).then((cache) => cache.put(new Request(url), clonedResponse));
}

const fetchFromNetwork = (event, cached) => {
	const requestToFetch = event.request.clone();
	return fetch(requestToFetch, { cache: 'reload' }).then((response) => {
		const clonedResponse = response.clone();
		const contentType = clonedResponse.headers.get('content-type');

		if (!clonedResponse || clonedResponse.status !== 200 || clonedResponse.type !== 'basic'
			|| /\/sockjs\//.test(event.request.url)) {
			return response;
		}

		if (/html/.test(contentType)) {
			caches.open(version).then((cache) => cache.put(HTMLToCache, clonedResponse));
		} else {
			// Delete old version of a file
			if (hasHash(event.request.url)) {
				caches.open(version).then((cache) => cache.keys().then((keys) => keys.forEach((asset) => {
					if (new RegExp(removeHash(event.request.url)).test(removeHash(asset.url))) {
						cache.delete(asset);
					}
				})));
			}

			if (/avatar\/.*\?_dc/.test(event.request.url)) {
				// handle the avatar updates
				handleAvatar(event.request, response);
			}

			caches.open(version).then((cache) => cache.put(event.request, clonedResponse));
		}
		return response;
	}).catch(() => {
		if (cached) { return cached; }
		// If the request URL hasn't been served from cache and isn't sockjs we suppose it's HTML
		if (!/\/sockjs\//.test(event.request.url)) { return caches.match(HTMLToCache); }
		// Only for sockjs
		return new Response('No connection to the server', {
			status: 503,
			statusText: 'No connection to the server',
			headers: new Headers({ 'Content-Type': 'text/plain' }),
		});
	});
};

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(version).then((cache) => {
		cache.add(HTMLToCache).then(self.skipWaiting());
	}));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames.map((cacheName) => {
						let res;
						if (version !== cacheName) {
							res = caches.delete(cacheName);
						}
						return res;
					}),
				),
			)
			.then(self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method === 'POST') {
		return;
	}

	event.respondWith(
		caches.match(event.request.clone()).then((cached) => {
			// We don't return cached HTML (except if fetch failed)
			if (cached) {
				const resourceType = cached.headers.get('content-type');
				// We only return non css/js/html cached response e.g images
				if (!hasHash(event.request.url) && !/text\/html/.test(resourceType)) {
					// If API call try to respond with network response first
					if (/\/api\//.test(event.request.url)) {
						return fetchFromNetwork(event, cached);
					}
					// Refresh resources which are not(sound or assets)
					if (!/sounds/.test(event.request.url) && !/assets/.test(event.request.url) && !/font/.test(event.request.url)) {
						fetchFromNetwork(event, cached);
					}
					return cached;
				}

				// If the CSS/JS didn't change since it's been cached, return the cached version
				if (
					hasHash(event.request.url)
					&& hasSameHash(event.request.url, cached.url)
				) {
					return cached;
				}
			}
			return fetchFromNetwork(event);
		}),
	);
});

function isClientFocused(url) {
	return self.clients.matchAll({
		type: 'window',
		includeUncontrolled: true,
	}).then((windowClients) => {
		let clientIsFocused = false;
		let pathMatched = false;

		for (let i = 0; i < windowClients.length; i++) {
			const windowClient = windowClients[i];
			if (windowClient.focused) {
				clientIsFocused = true;

				const windowURL = new URL(windowClient.url);
				if (windowURL.pathname === url) {
					pathMatched = true;
				}
				break;
			}
		}

		return { clientIsFocused, pathMatched };
	});
}

self.addEventListener('push', function(event) {
	self.clients.matchAll().then((clients) => {
		const data = JSON.parse(event.data.text());
		if (clients && clients.length && data.platform !== 'mobile') {
			const client = clients[0];
			client.postMessage(data);
		} else {
			const options = {
				body: data.text,
				icon: data.icon,
				vibrate: data.vibrate,
				data: {
					dateOfArrival: Date.now(),
					redirectURL: data.redirectURL,
				},
				actions: [
					{ action: 'reply', title: 'Reply' },
					{ action: 'close', title: 'Close' },
				],
			};

			const promiseChain = isClientFocused(data.redirectURL)
				.then(({ clientIsFocused, pathMatched }) => {
					if (clientIsFocused && pathMatched) {
						// 'Don\'t need to show a notification.
						return;
					}

					// Client isn't focused, we need to show a notification.
					return self.registration.showNotification(data.title, options);
				});

			event.waitUntil(promiseChain);
		}
	});
});

self.addEventListener('notificationclick', function(event) {
	const { data } = event.notification;

	if (event.action !== 'close') {
		const promiseChain = self.clients.matchAll({
			type: 'window',
			includeUncontrolled: true,
		}).then((clients) => {
			if (clients && clients.length) {
				return clients[0].focus();
			}
			return self.clients.openWindow(data.redirectURL);
		});

		event.waitUntil(promiseChain);
	}
	event.notification.close();
}, false);
