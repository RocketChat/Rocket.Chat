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
const GZIP_CHUNKED_MAX_LENGTH = 100000;

// The encoding of the responses the race truncates.
const gzip = { headers: { 'Accept-Encoding': 'gzip' } };

const TOTAL_REQUESTS = 30000;
const CONCURRENCY = 64;

let clientFiles: string[] = [];
// `yarn dev` serves the client unbuilt from Vite, so there is no built file to replay.
let isDevServer = false;

const findClientFiles = async (): Promise<string[]> => {
	const page = await (await fetch(`${apiUrl}/home`)).text();
	isDevServer = /src="[^"]*\/entry\.ts"/.test(page);
	const urls = [...page.matchAll(/<(?:script type="module"|link rel="modulepreload")[^>]*?(?:src|href)="([^"]+\.js)"/g)].map(([, path]) =>
		new URL(path, apiUrl).toString(),
	);

	// The page names only the startup files; the chunks they load later are named in their code. Files just above the
	// gzip-chunked size keep the shape the race needs: the race is in the proxy, and replaying the largest files would
	// test how fast the server compresses them instead.
	const picked: string[] = [];
	const seen = new Set(urls);
	const queue = [...urls];
	while (queue.length && picked.length < 2) {
		const url = queue.shift() as string;
		const text = await (await fetch(url, gzip)).text();
		if (text.length > GZIP_CHUNKED_MIN_LENGTH && text.length < GZIP_CHUNKED_MAX_LENGTH) {
			picked.push(url);
		}
		for (const [, file] of text.matchAll(/["'`]\.\/([\w.-]+\.js)["'`]/g)) {
			const next = new URL(file, url).toString();
			if (!seen.has(next)) {
				seen.add(next);
				queue.push(next);
			}
		}
	}
	return picked;
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
	it('should serve client files large enough for the chunked gzip response shape the race depends on', async (t) => {
		clientFiles = await findClientFiles();
		if (isDevServer) {
			t.skip('the Vite dev server has no built client');
			return;
		}

		expect(clientFiles, 'the page loads no client file large enough to be served gzip-chunked').to.have.length.greaterThan(0);

		const response = await fetch(clientFiles[0], gzip);
		await response.text();
		expect(response.status).to.equal(200);
		expect(response.headers.get('content-encoding')).to.equal('gzip');
	});

	it(
		`should deliver ${TOTAL_REQUESTS} concurrent client file responses without a single truncation`,
		{ timeout: 10 * 60 * 1000 },
		async (t) => {
			if (isDevServer) {
				t.skip('the Vite dev server has no built client');
				return;
			}
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
