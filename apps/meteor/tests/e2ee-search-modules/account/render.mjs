import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import('@playwright/test');
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { build } = require('esbuild');
const here = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(process.argv[2] ?? '/tmp/e2ee-account-render');
await mkdir(outputDirectory, { recursive: true });
const result = await build({
	entryPoints: [resolve(here, 'browserEntry.tsx')],
	absWorkingDir: resolve(here, '../../..'),
	outfile: resolve(outputDirectory, 'preview.js'),
	bundle: true,
	write: false,
	platform: 'browser',
	format: 'iife',
	target: 'es2022',
	jsx: 'automatic',
	define: { 'process.env.NODE_ENV': '"development"', 'global': 'globalThis' },
	loader: { '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl', '.eot': 'dataurl', '.svg': 'dataurl', '.png': 'dataurl' },
	plugins: [
		{
			name: 'account-preview-boundaries',
			setup(builder) {
				builder.onResolve({ filter: /\/lib\/e2ee\/rocketchat\.e2e$/ }, () => ({ path: resolve(here, 'runtime.ts') }));
				builder.onResolve(
					{ filter: /^(react|react-dom|react-i18next|@tanstack\/react-query|@tanstack\/query-core)(\/.*)?$/ },
					({ path }) => ({
						path: require.resolve(path === 'react-dom/server' ? 'react-dom/server.browser' : path),
					}),
				);
			},
		},
	],
});
const files = new Map(result.outputFiles.map((file) => [`/${file.path.split('/').pop()}`, file.contents]));
const server = createServer((request, response) => {
	if (request.url === '/') {
		response.setHeader('Content-Type', 'text/html');
		response.end(
			'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Account security preview</title><link rel="stylesheet" href="/preview.css"></head><body><main style="max-width:600px;padding:24px;margin:auto"><div id="root"></div></main><script src="/preview.js"></script></body></html>',
		);
		return;
	}
	const file = files.get(request.url);
	if (!file) {
		response.writeHead(404).end();
		return;
	}
	response.setHeader('Content-Type', request.url.endsWith('.css') ? 'text/css' : 'application/javascript');
	response.end(file);
});
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
let browser;
try {
	browser = await chromium.launch({ channel: 'chrome', headless: true });
	const page = await browser.newPage({ viewport: { width: 760, height: 620 } });
	const errors = [];
	page.on('pageerror', (error) => {
		errors.push(error.message);
		console.error(error.message);
	});
	await page.goto(`http://127.0.0.1:${server.address().port}`);
	assert.deepEqual(errors, []);
	const toggle = page.getByRole('checkbox', { name: 'Index my encrypted messages on this device' });
	await toggle.waitFor({ state: 'attached' });
	assert.equal(await toggle.isChecked(), false);
	await page.screenshot({ path: resolve(outputDirectory, 'opt-in-off.png'), fullPage: true });
	await page.getByText('Index my encrypted messages on this device', { exact: true }).click();
	assert.equal(await toggle.isChecked(), true);
	await page.screenshot({ path: resolve(outputDirectory, 'opt-in-on.png'), fullPage: true });
	await page.getByRole('button', { name: 'Reset E2EE password' }).click();
	await page.getByRole('dialog').waitFor();
	await page.screenshot({ path: resolve(outputDirectory, 'reset-confirmation.png'), fullPage: true });
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	assert.equal(await page.getByRole('dialog').count(), 0);
	assert.deepEqual(errors, []);
	console.log(JSON.stringify({ screenshots: 3, toggle: 'PASS', cancel: 'PASS', pageErrors: errors, outputDirectory }));
} finally {
	await browser?.close();
	await new Promise((closed) => server.close(closed));
}
