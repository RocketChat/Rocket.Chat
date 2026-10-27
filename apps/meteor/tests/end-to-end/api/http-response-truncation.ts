import { describe, it } from 'node:test';

import { expect } from 'chai';

import { apiUrl } from '../../data/api-data';

// Regression test for the response truncation flake (PR #41399).
//
// Through traefik with `serverstransport.maxidleconnsperhost=-1` (upstream
// keep-alive disabled), Go's transport rarely closes its upstream connection
// while the ReverseProxy is still copying a chunked gzip response body
// ("use of closed network connection"), truncating the response mid-stream:
// the browser gets 200 headers and then ERR_INCOMPLETE_CHUNKED_ENCODING, and
// the page never loads the client. Rate is ~1.6e-4 per request under load, so
// this test replays the request shape the page makes (the client's own files,
// large enough to be served gzip-chunked) at high volume and concurrency: red
// on the broken proxy config, green once upstream keep-alive is restored.
//
// The files are found in the page the server renders, so the test follows the
// build; it asserts first that they are large enough to keep the chunked+gzip
// shape the race needs.

const GZIP_CHUNKED_MIN_LENGTH = 10000;

// The encoding of the responses the race truncates.
const gzip = { headers: { 'Accept-Encoding': 'gzip' } };

const TOTAL_REQUESTS = 30000;
const CONCURRENCY = 64;

let clientFiles: string[] = [];

const findClientFiles = async (): Promise<string[]> => {
	const page = await (await fetch(`${apiUrl}/home`)).text();
	const urls = [...page.matchAll(/<(?:script type="module"|link rel="modulepreload")[^>]*?(?:src|href)="([^"]+\.js)"/g)].map(([, path]) =>
		new URL(path, apiUrl).toString(),
	);

	const sized = await Promise.all(urls.map(async (url) => ({ url, length: (await (await fetch(url, gzip)).text()).length })));
	return sized
		.filter(({ length }) => length > GZIP_CHUNKED_MIN_LENGTH)
		.sort((a, b) => b.length - a.length)
		.slice(0, 2)
		.map(({ url }) => url);
};

const fetchClientFile = async (url: string): Promise<{ error?: string }> => {
	try {
		const response = await fetch(url, gzip);
		if (response.status !== 200) {
			return { error: `unexpected status ${response.status}` };
		}
		await response.text();
		return {};
	} catch (error) {
		return { error: `${error} (cause: ${(error as { cause?: unknown }).cause})` };
	}
};

describe('client file delivery through the proxy', () => {
	it('should serve client files large enough for the chunked gzip response shape the race depends on', async () => {
		clientFiles = await findClientFiles();

		expect(clientFiles, 'the page loads no client file large enough to be served gzip-chunked').to.have.length.greaterThan(0);

		const response = await fetch(clientFiles[0], gzip);
		await response.text();
		expect(response.status).to.equal(200);
		expect(response.headers.get('content-encoding')).to.equal('gzip');
	});

	it(
		`should deliver ${TOTAL_REQUESTS} concurrent client file responses without a single truncation`,
		{ timeout: 10 * 60 * 1000 },
		async () => {
			const failures: string[] = [];
			let issued = 0;

			const worker = async (): Promise<void> => {
				while (issued < TOTAL_REQUESTS && failures.length === 0) {
					const current = issued++;
					const { error } = await fetchClientFile(clientFiles[current % clientFiles.length]);
					if (error) {
						failures.push(`request #${current}: ${error}`);
					}
				}
			};

			await Promise.all(Array.from({ length: CONCURRENCY }, worker));

			expect(failures).to.deep.equal([]);
		},
	);
});
