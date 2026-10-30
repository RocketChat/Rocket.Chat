import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../../../../package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const { build } = require('esbuild');
const here = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(process.argv[2] ?? '/tmp/e2ee-search-ui-render');
await mkdir(outputDirectory, { recursive: true });

const result = await build({
	entryPoints: [resolve(here, 'browserEntry.tsx')],
	absWorkingDir: resolve(here, '../../../../..'),
	outfile: resolve(outputDirectory, 'preview.js'),
	bundle: true,
	write: false,
	platform: 'browser',
	format: 'iife',
	target: 'es2022',
	jsx: 'automatic',
	define: { 'process.env.NODE_ENV': '"development"', 'global': 'globalThis' },
	loader: { '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl', '.svg': 'dataurl', '.png': 'dataurl' },
	plugins: [
		{
			name: 'ui-source-date-exports',
			setup(builder) {
				builder.onResolve({ filter: /^(react|react-dom|react-i18next)(\/.*)?$/ }, ({ path }) => ({
					path: require.resolve(path === 'react-dom/server' ? 'react-dom/server.browser' : path),
				}));
			},
		},
	],
});

const files = new Map(result.outputFiles.map((file) => [`/${file.path.split('/').pop()}`, file.contents]));
const server = createServer((request, response) => {
	if (request.url === '/') {
		response.setHeader('Content-Type', 'text/html');
		response.end(
			'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Local search preview</title><link rel="stylesheet" href="/preview.css"></head><body><div id="root"></div><script src="/preview.js"></script></body></html>',
		);
		return;
	}
	const file = files.get(request.url);
	if (file) {
		response.setHeader('Content-Type', request.url.endsWith('.css') ? 'text/css' : 'application/javascript');
		response.end(file);
		return;
	}
	response.writeHead(404).end();
});
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
let browser;
try {
	browser = await chromium.launch({ channel: 'chrome', headless: true });
	const page = await browser.newPage({ viewport: { width: 520, height: 720 }, timezoneId: 'UTC' });
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(`http://127.0.0.1:${server.address().port}`);
	await page.getByText('Alice Doe', { exact: true }).waitFor();
	assert.equal(await page.locator('[data-qa="local-message-search-hit"]').count(), 3);
	await page.getByText('needle', { exact: true }).click();
	assert.deepEqual(await page.evaluate(() => window.e2eeSearchUiPreview.openedHits), ['message']);
	const rows = page.locator('[data-qa="local-message-search-hit"]');
	await rows.first().focus();
	await page.keyboard.press('ArrowDown');
	assert.equal(await rows.nth(1).evaluate((row) => row === document.activeElement), true);
	await page.keyboard.press('Tab');
	assert.equal(await page.getByRole('button', { name: 'After results' }).evaluate((button) => button === document.activeElement), true);
	await page.screenshot({ path: resolve(outputDirectory, 'results.png'), fullPage: true });
	await page.evaluate(() => window.e2eeSearchUiPreview.show('WithoutAvatars'));
	await page.waitForFunction(() => document.querySelectorAll('[data-username]').length === 0);
	await page.screenshot({ path: resolve(outputDirectory, 'without-avatars.png'), fullPage: true });
	await page.evaluate(() => window.e2eeSearchUiPreview.show('Empty'));
	await page.waitForFunction(() => document.querySelectorAll('[data-qa="local-message-search-hit"]').length === 0);
	await page.screenshot({ path: resolve(outputDirectory, 'empty.png'), fullPage: true });
	assert.deepEqual(errors, []);
	const evidence = {
		mode: 'production components with rebuilt workspace packages and controlled providers',
		stories: 3,
		hits: 3,
		keyboard: 'PASS',
		activation: 'PASS',
		pageErrors: errors,
	};
	await writeFile(resolve(outputDirectory, 'evidence.json'), JSON.stringify(evidence, null, 2));
	console.log(JSON.stringify({ ...evidence, outputDirectory }));
} finally {
	await browser?.close();
	await new Promise((closed) => server.close(closed));
}
