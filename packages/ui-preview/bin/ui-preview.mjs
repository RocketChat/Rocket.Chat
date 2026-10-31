#!/usr/bin/env node
// Serves the web client a pull request published to ghcr.io (see .github/workflows/ui-preview.yml) and proxies
// everything else to a running Rocket.Chat server, so a PR's UI can be tried without cloning or building it.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';

import { preview } from 'vite';

const repository = 'rocketchat/rocket.chat-web';

const usage = `Usage: npx @rocket.chat/ui-preview <pull request number or URL> [options]

  --pr <number>     Latest build of a pull request (same as the positional argument)
  --sha <sha>       Exact build of a commit (with --pr, that PR's build of it)
  --develop         Latest build of develop
  --server <url>    Rocket.Chat server to run against (default: https://open.rocket.chat)
  --port <port>     Local port (default: 3000)
  -h, --help        Show this help`;

const { values: args, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		pr: { type: 'string' },
		sha: { type: 'string' },
		develop: { type: 'boolean' },
		server: { type: 'string', default: 'https://open.rocket.chat' },
		port: { type: 'string', default: '3000' },
		help: { type: 'boolean', short: 'h' },
	},
});

const fail = (message) => {
	console.error(message);
	process.exit(1);
};

if (args.help) {
	console.log(usage);
	process.exit(0);
}

const tag = (() => {
	const prArg = args.pr ?? positionals[0];
	// Accepts `42665` or a pull request URL, so a link copied from GitHub works as is.
	const pr =
		prArg && (prArg.match(/^(\d+)$/) ?? prArg.match(/^https:\/\/github\.com\/RocketChat\/Rocket\.Chat\/pull\/(\d+)(?:[/?#]|$)/i))?.[1];
	if (prArg && !pr) fail(`"${prArg}" is not a Rocket.Chat pull request number or URL.\n\n${usage}`);
	if (args.sha && !/^[0-9a-f]{40}$/.test(args.sha)) fail(`--sha must be a full 40-character commit hash.\n\n${usage}`);
	if (pr && args.sha) return `pr-${pr}-${args.sha}`;
	if (pr) return `pr-${pr}`;
	if (args.sha) return args.sha;
	if (args.develop) return 'develop';
	fail(usage);
})();

const server = new URL(args.server).origin;

const registry = async (path, headers) => {
	const response = await fetch(`https://ghcr.io/v2/${repository}/${path}`, { headers });
	if (response.status === 404) {
		fail(
			`No UI preview found for "${tag}". Previews are built for pull requests labeled \`preview\` by the UI Preview workflow, ` +
				'and removed when the label is removed or the PR is closed.',
		);
	}
	if (!response.ok) fail(`ghcr.io answered ${response.status} for ${path}.`);
	return response;
};

const download = async () => {
	const tokenResponse = await fetch(`https://ghcr.io/token?scope=repository:${repository}:pull`);
	if (!tokenResponse.ok) fail(`Could not get an anonymous ghcr.io token (${tokenResponse.status}).`);
	const auth = { Authorization: `Bearer ${(await tokenResponse.json()).token}` };

	const manifest = await (await registry(`manifests/${tag}`, { ...auth, Accept: 'application/vnd.oci.image.manifest.v1+json' })).json();
	const { digest } = manifest.layers[0];
	const revision = manifest.annotations?.['org.opencontainers.image.revision'];

	// Builds are immutable per digest, so a cached one never needs refreshing.
	const dir = join(homedir(), '.cache', 'rocketchat-ui-preview', digest.replace(':', '-'));
	if (existsSync(dir)) return { dir, revision };

	console.log(`Downloading ${tag}${revision ? ` (${revision.slice(0, 7)})` : ''}...`);
	const partial = `${dir}.partial`;
	await rm(partial, { recursive: true, force: true });
	await mkdir(partial, { recursive: true });

	const blob = await registry(`blobs/${digest}`, auth);
	const tar = spawn('tar', ['-xzf', '-', '-C', partial], { stdio: ['pipe', 'inherit', 'inherit'] });
	const exited = new Promise((resolve, reject) => {
		tar.on('error', reject);
		tar.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`tar exited with ${code}`))));
	});
	await Promise.all([pipeline(Readable.fromWeb(blob.body), tar.stdin), exited]);

	// The Meteor server injects this global into the pages it serves; here the page comes from this server instead.
	const indexHtml = join(partial, 'index.html');
	const html = await readFile(indexHtml, 'utf8');
	await writeFile(
		indexHtml,
		html.replace(
			'<head>',
			`<head><script>window.__meteor_runtime_config__ = { ROOT_URL: window.location.origin + '/', ROOT_URL_PATH_PREFIX: '' };</script>`,
		),
	);

	await rename(partial, dir);
	return { dir, revision };
};

// Paths a browser navigates to that the server, not the client, must answer (OAuth popups, downloads, livechat).
const serverPages = ['/api', '/oauth', '/_oauth', '/_saml', '/_cas', '/file-upload', '/file-decrypt', '/ufs', '/data-export', '/livechat'];

// Client routes nested under a server page prefix (the OAuth provider's consent and error pages).
const clientPagesUnderServerPages = ['/oauth/authorize', '/oauth/error'];

const matchesPath = (url, prefix) => url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`);

const isClientPage = (req) =>
	req.method === 'GET' &&
	req.headers.accept?.includes('text/html') &&
	(clientPagesUnderServerPages.some((prefix) => matchesPath(req.url, prefix)) ||
		!serverPages.some((prefix) => matchesPath(req.url, prefix)));

const proxyTo = (options = {}) => ({
	target: server,
	changeOrigin: true,
	secure: true,
	// Session cookies the server sets (rc_token for avatars and downloads) must land on this origin.
	cookieDomainRewrite: '',
	...options,
});

const { dir, revision } = await download();

const app = await preview({
	configFile: false,
	logLevel: 'warn',
	build: { outDir: dir },
	preview: {
		port: Number(args.port),
		strictPort: true,
		proxy: {
			'/websocket': proxyTo({ ws: true }),
			'/sockjs': proxyTo({ ws: true }),
			// The bundle holds only index.html and bundle/; every other path (API, assets, public files) is the server's.
			'^/': proxyTo({
				bypass: (req) => {
					if (req.url.startsWith('/bundle/')) return req.url;
					if (isClientPage(req)) return '/index.html';
				},
			}),
		},
	},
});

console.log(`\nUI preview ${tag}${revision ? ` (${revision.slice(0, 7)})` : ''} against ${server}`);
console.log(`  ➜ ${app.resolvedUrls.local[0]}`);
