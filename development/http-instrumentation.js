'use strict';

// Global HTTP/HTTPS instrumentation for any Node process that preloads this file.
//
// Usage (from the Rocket.Chat repo root):
//   NODE_OPTIONS="--require ./development/http-instrumentation.js" yarn build:ci
//
// This will log, to stderr:
//   - Request start: method, full URL, headers
//   - Response: status code, duration
//   - Error: message (e.g., "socket hang up"), duration
//   - Timeout: duration
//
// It works by wrapping http/https request/get, so anything built on top of them
// (including Meteor tooling and most HTTP client libraries) will be captured.

const http = require('http');
const https = require('https');
const { URL } = require('url');

function safeJson(obj) {
	try {
		return JSON.stringify(obj);
	} catch (e) {
		return '"[unserializable]"';
	}
}

function nowIso() {
	return new Date().toISOString();
}

/**
 * Normalize the (url, options, callback) variants Node supports and
 * return a normalized description: { url, method, headers }.
 */
function normalizeRequestArgs(protocol, input, options, callback) {
	let url;
	let method = 'GET';
	let headers;

	// Pattern 1: (string|URL[, options][, cb])
	if (typeof input === 'string' || input instanceof URL) {
		const baseUrl = input.toString();
		if (typeof options === 'function') {
			callback = options;
			options = undefined;
		}
		options = options || {};
		method = options.method || 'GET';
		headers = options.headers || {};

		try {
			url = new URL(baseUrl);
		} catch {
			// Fallback: try with protocol if missing
			try {
				url = new URL(baseUrl, protocol + '//localhost');
			} catch {
				url = null;
			}
		}

		return { url, method, headers, options, callback };
	}

	// Pattern 2: (options[, cb])
	options = input || {};
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	method = options.method || 'GET';
	headers = options.headers || {};

	if (options.href) {
		try {
			url = new URL(options.href);
		} catch {
			url = null;
		}
	} else if (options.protocol && options.hostname) {
		const port = options.port ? `:${options.port}` : '';
		const path = options.path || '/';
		try {
			url = new URL(`${options.protocol}//${options.hostname}${port}${path}`);
		} catch {
			url = null;
		}
	} else if (options.host) {
		// host may include port
		const [hostname, portRaw] = String(options.host).split(':');
		const port = portRaw ? `:${portRaw}` : options.port ? `:${options.port}` : '';
		const proto = options.protocol || protocol || 'http:';
		const path = options.path || '/';
		try {
			url = new URL(`${proto}//${hostname}${port}${path}`);
		} catch {
			url = null;
		}
	} else {
		// As a last resort, assume localhost with protocol
		const proto = options.protocol || protocol || 'http:';
		const hostname = options.hostname || 'localhost';
		const port = options.port ? `:${options.port}` : '';
		const path = options.path || '/';
		try {
			url = new URL(`${proto}//${hostname}${port}${path}`);
		} catch {
			url = null;
		}
	}

	return { url, method, headers, options, callback };
}

function wrapRequest(originalRequest, protocol) {
	return function wrappedRequest(input, options, callback) {
		const norm = normalizeRequestArgs(protocol, input, options, callback);
		const { url, method, headers } = norm;

		// Update callsite args in case normalizeRequestArgs adjusted them
		options = norm.options;
		callback = norm.callback;

		const href = url ? url.toString() : '(unknown-url)';
		const start = Date.now();

		// Log request creation
		// Use stderr so it does not interfere with normal stdout output.
		// Include timestamp to align with other logs.
		// NOTE: headers may contain auth tokens; for deep debugging only.
		// You can redact here if needed.
		// Example line:
		// [HTTP-INSTRUMENT] 2025-02-01T10:00:00.000Z REQUEST START GET https://example.com/path
		console.error(`[HTTP-INSTRUMENT] ${nowIso()} REQUEST START ${method} ${href}`);

		let req;
		try {
			// Preserve original this/arguments semantics as much as possible
			if (input === options || typeof input === 'object') {
				// pattern (options[, cb])
				req = originalRequest.call(this, options, callback);
			} else {
				req = originalRequest.call(this, href, options, callback);
			}
		} catch (err) {
			const duration = Date.now() - start;
			console.error(`[HTTP-INSTRUMENT] ${nowIso()} ERROR (SYNC) ${method} ${href} duration=${duration}ms error=${err && err.message}`);
			throw err;
		}

		// Attach metadata to req in case other tools want it
		try {
			req.__httpInstrumentation = { href, method, start };
		} catch {
			// ignore if something prevents setting properties
		}

		// Response event
		req.on('response', (res) => {
			const duration = Date.now() - start;
			console.error(`[HTTP-INSTRUMENT] ${nowIso()} RESPONSE ${method} ${href} status=${res.statusCode} duration=${duration}ms`);
		});

		// Error event (includes socket hang up, ECONNRESET, etc.)
		req.on('error', (err) => {
			const duration = Date.now() - start;
			console.error(`[HTTP-INSTRUMENT] ${nowIso()} ERROR ${method} ${href} duration=${duration}ms error=${err && err.message}`);
		});

		// Timeout event if req.setTimeout() is used
		req.on('timeout', () => {
			const duration = Date.now() - start;
			console.error(`[HTTP-INSTRUMENT] ${nowIso()} TIMEOUT ${method} ${href} duration=${duration}ms`);
		});

		return req;
	};
}

function wrapGet(originalGet, wrappedRequest) {
	return function wrappedGet(input, options, callback) {
		const req = wrappedRequest.call(this, input, options, callback);
		// http.get/https.get automatically call req.end()
		try {
			req.end();
		} catch (err) {
			console.error(
				`[HTTP-INSTRUMENT] ${nowIso()} ERROR (get-end) ${req && req.__httpInstrumentation ? req.__httpInstrumentation.method : 'GET'} ${
					req && req.__httpInstrumentation ? req.__httpInstrumentation.href : '(unknown-url)'
				} error=${err && err.message}`,
			);
			throw err;
		}
		return req;
	};
}

// Patch http
http.request = wrapRequest(http.request, 'http:');
http.get = wrapGet(http.get, http.request);

// Patch https
https.request = wrapRequest(https.request, 'https:');
https.get = wrapGet(https.get, https.request);

console.error(`[HTTP-INSTRUMENT] ${nowIso()} Global HTTP/HTTPS instrumentation installed`);
