import { expect } from 'chai';
import { describe, it } from 'mocha';

import { apiUrl } from '../../data/api-data';

// Regression test for the dynamic-import response truncation flake (PR #41399).
//
// Through traefik with `serverstransport.maxidleconnsperhost=-1` (upstream
// keep-alive disabled), Go's transport rarely closes its upstream connection
// while the ReverseProxy is still copying a chunked gzip response body
// ("use of closed network connection"), truncating the response mid-stream:
// the browser gets 200 headers and then ERR_INCOMPLETE_CHUNKED_ENCODING, and
// the meteor module loader hangs the page. Rate is ~1.6e-4 per request under
// load, so this test replays the exact request shape (real dynamic-import
// bodies captured from a failing CI run — the fatal one is the same
// AppLayoutThemeWrapper.tsx request seen in every reproduction) at high
// volume and concurrency: red on the broken proxy config, green once
// upstream keep-alive is restored.
//
// The bodies are build-dependent fixtures: if the app tree renames these
// modules the responses shrink below the gzip threshold and lose the
// chunked+gzip shape the race needs, so the test asserts that shape first.

const FETCH_URL = `${apiUrl}/__meteor__/dynamic-import/fetch`;

const BODIES = [
	'{"client":{"components":{"AppLayoutThemeWrapper.tsx":1}}}',
	'{"client":{"meteor":{"login":{"index.ts":1,"cas.ts":1,"crowd.ts":1,"facebook.ts":1,"oauth.ts":1,"LoginCancelledError.ts":1,"google.ts":1,"ldap.ts":1,"meteorDeveloperAccount.ts":1,"password.ts":1,"saml.ts":1,"twitter.ts":1}},"lib":{"2fa":{"overrideLoginMethod.ts":1},"wrapRequestCredentialFn.ts":1,"loginServices.ts":1}},"node_modules":{"@rocket.chat":{"string-helpers":{"package.json":1,"dist":{"esm":{"index.js":1}}}}}}',
];

const TOTAL_REQUESTS = 30000;
const CONCURRENCY = 64;

const fetchModuleTree = async (body: string): Promise<{ error?: string }> => {
	try {
		const response = await fetch(FETCH_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
			body,
		});
		if (response.status !== 200) {
			return { error: `unexpected status ${response.status}` };
		}
		await response.text();
		return {};
	} catch (error) {
		return { error: `${error} (cause: ${(error as { cause?: unknown }).cause})` };
	}
};

describe('dynamic-import response delivery through the proxy', () => {
	it('should keep the chunked gzip response shape the race depends on', async () => {
		const response = await fetch(FETCH_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
			body: BODIES[1],
		});
		const text = await response.text();
		expect(response.status).to.equal(200);
		expect(
			text.length,
			'fixture went stale: response too small to be gzip-chunked, update BODIES from a fresh browser trace',
		).to.be.greaterThan(10000);
	});

	it(`should deliver ${TOTAL_REQUESTS} concurrent dynamic-import responses without a single truncation`, async function () {
		this.timeout(10 * 60 * 1000);

		const failures: string[] = [];
		let issued = 0;

		const worker = async (): Promise<void> => {
			while (issued < TOTAL_REQUESTS && failures.length === 0) {
				const current = issued++;
				const { error } = await fetchModuleTree(BODIES[current % BODIES.length]);
				if (error) {
					failures.push(`request #${current}: ${error}`);
				}
			}
		};

		await Promise.all(Array.from({ length: CONCURRENCY }, worker));

		expect(failures).to.deep.equal([]);
	});
});
