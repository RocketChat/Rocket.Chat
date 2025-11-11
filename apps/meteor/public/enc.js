self.addEventListener('install', function (event) {
	event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', function (event) {
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
	try {
		const urlObj = new URL(url, location.origin);
		const keyParam = urlObj.searchParams.get('key');
		if (!keyParam) {
			console.error('[SW decrypt] Missing key param');
			return null;
		}
		let decoded;
		try {
			decoded = base64DecodeString(keyParam);
		} catch (e) {
			console.error('[SW decrypt] Failed base64 decode key param', e);
			return null;
		}
		urlObj.searchParams.delete('key');
		let parsed;
		try {
			parsed = JSON.parse(decoded);
		} catch (e) {
			console.error('[SW decrypt] Failed JSON parse key payload', e);
			return null;
		}
		const { key, iv, name, type } = parsed;
		if (!key || !iv) {
			console.error('[SW decrypt] Missing key or iv in payload');
			return null;
		}
		const newUrl = urlObj.href.replace('/file-decrypt/', '/');
		return { key, iv, url: newUrl, name, type };
	} catch (e) {
		console.error('[SW decrypt] Unexpected error extracting params', e);
		return null;
	}
};

self.addEventListener('fetch', (event) => {
	if (!event.request.url.includes('/file-decrypt/')) {
		return;
	}

	const params = getUrlParams(event.request.url);
	if (!params) {
		// If params invalid, let network fail naturally (or we could return a 400)
		return;
	}
	const { url, key, iv, name, type } = params;

	const requestToFetch = new Request(url, {
		...event.request,
		mode: 'cors',
		// ensure GET (some browsers may revalidate differently)
		method: 'GET',
	});

	event.respondWith(
		(async () => {
			try {
				const cached = await caches.match(requestToFetch);
				if (cached) {
					return cached;
				}

				const res = await fetch(requestToFetch);
				if (!res.ok) {
					console.error('[SW decrypt] Upstream fetch failed', res.status, res.statusText);
					return res; // propagate original error response
				}
				let file;
				try {
					file = await res.arrayBuffer();
				} catch (e) {
					console.error('[SW decrypt] Failed reading body (CORS?)', e);
					return res;
				}
				if (!file || file.byteLength === 0) {
					console.error('[SW decrypt] Empty file body');
					return res;
				}
				let result;
				try {
					result = await decrypt(key, iv, file);
				} catch (e) {
					console.error('[SW decrypt] Decrypt failed', e);
					return res; // fallback to encrypted file (may still download)
				}
				if (!result) {
					console.error('[SW decrypt] Decrypt produced empty result');
					return res;
				}
				const newHeaders = new Headers(res.headers);
				if (name) {
					newHeaders.set('Content-Disposition', 'inline; filename="' + name + '"');
				}
				if (type) {
					newHeaders.set('Content-Type', type);
				}
				const decryptedResponse = new Response(result, {
					status: res.status,
					statusText: res.statusText,
					headers: newHeaders,
				});
				try {
					const cache = await caches.open('v1');
					await cache.put(requestToFetch, decryptedResponse.clone());
				} catch (e) {
					console.error('[SW decrypt] Failed caching decrypted file', e);
				}
				return decryptedResponse;
			} catch (error) {
				console.error('[SW decrypt] Fetch handler unexpected error', error);
				// Return generic error response to avoid unhandled promise rejection
				return new Response('', { status: 502 });
			}
		})(),
	);
});

self.addEventListener('message', async (event) => {
	if (event.data.type !== 'attachment-download') {
		return;
	}
	const params = getUrlParams(event.data.url);
	if (!params) {
		console.error('[SW decrypt] Invalid params on message download');
		return;
	}
	const { url, key, iv } = params;
	try {
		const requestToFetch = new Request(event.data.url);
		const res = (await caches.match(requestToFetch)) ?? (await fetch(url));
		let file;
		try {
			file = await res.arrayBuffer();
		} catch (e) {
			console.error('[SW decrypt] Failed reading message body', e);
			return;
		}
		let result;
		try {
			result = await decrypt(key, iv, file);
		} catch (e) {
			console.error('[SW decrypt] Decrypt failed on message', e);
			return;
		}
		event.source.postMessage({
			id: event.data.id,
			type: 'attachment-download-result',
			result,
		});
	} catch (error) {
		console.error('[SW decrypt] Attachment download unexpected error', error);
	}
});
