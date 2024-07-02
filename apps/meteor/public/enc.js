self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim()); // Become available to all pages
});

function base64Decode(string) {
	string = atob(string);
	const length = string.length,
		buf = new ArrayBuffer(length),
		bufView = new Uint8Array(buf);
	for (var i = 0; i < string.length; i++) {
		bufView[i] = string.charCodeAt(i);
	}
	return buf;
}

function base64DecodeString(string) {
	return atob(string);
}

const decrypt = async (key, iv, file) => {
	const ivArray = base64Decode(iv);
	const cryptoKey = await crypto.subtle.importKey('jwk', key, { name: 'AES-CTR' }, true, ['encrypt', 'decrypt']);
	const result = await crypto.subtle.decrypt({ name: 'AES-CTR', counter: ivArray, length: 64 }, cryptoKey, file);

	return result;
};

const getUrlParams = (url) => {
	const urlObj = new URL(url, location.origin);

	const k = base64DecodeString(urlObj.searchParams.get('key'));

	urlObj.searchParams.delete('key');

	const { key, iv, name, type } = JSON.parse(k);

	const newUrl = urlObj.href.replace('/file-decrypt/', '/');

	return { key, iv, url: newUrl, name, type };
};

self.addEventListener('fetch', (event) => {
	if (!event.request.url.includes('/file-decrypt/')) {
		return;
	}

	try {
		const { url, key, iv, name, type } = getUrlParams(event.request.url);

		const requestToFetch = new Request(url, {
			...event.request,
			mode: 'cors',
		});

		event.respondWith(
			caches.match(requestToFetch).then((response) => {
				if (response) {
					return response;
				}

				return fetch(requestToFetch)
					.then(async (res) => {
						const file = await res.arrayBuffer();

						if (res.status !== 200 || file.byteLength === 0) {
							console.error('Failed to fetch file', { req: requestToFetch, res });
							return res;
						}

						const result = await decrypt(key, iv, file);

						const newHeaders = new Headers(res.headers);
						newHeaders.set('Content-Disposition', 'inline; filename="'+name+'"');
						newHeaders.set('Content-Type', type);

						const response = new Response(result, {
							status: res.status,
							statusText: res.statusText,
							headers: newHeaders,
						});

						await caches.open('v1').then((cache) => {
							cache.put(requestToFetch, response.clone());
						});

						return response;
					})
					.catch((error) => {
						console.error('Fetching failed:', error);

						throw error;
					});
			}),
		);
	} catch (error) {
		console.error(error);
		throw error;
	}
});

self.addEventListener('message', async (event) => {
	if (event.data.type !== 'attachment-download') {
		return;
	}

	const requestToFetch = new Request(event.data.url);

	const { url, key, iv } = getUrlParams(event.data.url);
	const res = (await caches.match(requestToFetch)) ?? (await fetch(url));

	const file = await res.arrayBuffer();
	const result = await decrypt(key, iv, file);
	event.source
		.postMessage({
			id: event.data.id,
			type: 'attachment-download-result',
			result,
		});
		// .catch((error) => {
		// 	console.error('Posting message failed:', error);
		// 	event.source.postMessage({
		// 		id: event.data.id,
		// 		type: 'attachment-download-result',
		// 		error,
		// 	});
		// });
});
