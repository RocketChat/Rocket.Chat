function base64Decode (string) {
	string = atob(string);
	const
	  length = string.length,
	  buf = new ArrayBuffer(length),
	  bufView = new Uint8Array(buf);
	for (var i = 0; i < string.length; i++) { bufView[i] = string.charCodeAt(i) }
	return buf
}

function base64DecodeString (string) {
	return atob(string);
}

self.addEventListener('fetch', (event) => {
	if (!event.request.url.includes('/file-decrypt/')) {
		return;
	}

	const url = new URL(event.request.url);
	const k = base64DecodeString(url.searchParams.get('key'));

	console.log(url);
	const {
		key,
		iv
	} = JSON.parse(k);

	const newUrl = url.href.replace('/file-decrypt/', '/');

	const requestToFetch = new Request(newUrl, event.request);

	event.respondWith(
		caches.match(requestToFetch).then((response) => {
			if (response) {
				console.log('cached');
				return response;
			}

			return fetch(requestToFetch)
				.then(async (response) => {
					const file = await response.arrayBuffer();
					const ivArray = base64Decode(iv);
					const cryptoKey = await crypto.subtle.importKey('jwk', key, { name: 'AES-CTR' }, true, ['encrypt', 'decrypt']);
					const result = await crypto.subtle.decrypt({ name: 'AES-CTR', counter: ivArray, length: 64 }, cryptoKey, file);
					return new Response(result);
				})
				.catch((error) => {
					console.error("Fetching failed:", error);

					throw error;
				});
		}),
	);
});
