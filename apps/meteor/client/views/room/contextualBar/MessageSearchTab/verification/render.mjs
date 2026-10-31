import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '../../../../../..');
const repoRoot = resolve(appRoot, '../..');
const require = createRequire(resolve(appRoot, 'package.json'));
const { chromium } = require('@playwright/test');
const { build } = require('esbuild');
const sass = require('sass');
const outputDirectory = resolve(process.argv[2] ?? '/tmp/e2ee-message-search-controller-render');
await mkdir(outputDirectory, { recursive: true });

const result = await build({
	entryPoints: [resolve(here, 'browserEntry.tsx')],
	absWorkingDir: appRoot,
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
			name: 'message-search-preview-boundaries',
			setup(builder) {
				builder.onResolve({ filter: /^@rocket\.chat\/desktop-api$/ }, () => ({
					path: resolve(repoRoot, 'packages/desktop-api/src/e2eeSearch.ts'),
				}));
				builder.onResolve({ filter: /^\.\.\/Box$/ }, ({ importer }) =>
					importer === resolve(repoRoot, 'packages/fuselage/src/components/Contextualbar/ContextualbarContent.tsx')
						? { path: resolve(here, 'browserBox.ts') }
						: undefined,
				);
				builder.onResolve(
					{
						filter:
							/\/lib\/(e2ee\/rocketchat\.e2e|absoluteUrl|getRoomTypeTranslation|e2eeSearch\/getSearchIndexBackend|utils\/setMessageJumpQueryStringParameter)$/,
					},
					() => ({ path: resolve(here, 'browserRuntime.ts') }),
				);
				builder.onResolve({ filter: /\/contexts\/RoomContext$/ }, () => ({ path: resolve(here, 'browserRuntime.ts') }));
				builder.onResolve({ filter: /(?:^|\/)stores$/ }, () => ({ path: resolve(here, 'browserStores.ts') }));
				builder.onResolve(
					{
						filter:
							/(?:\/MessageList\/(?:providers\/MessageListProvider|MessageListErrorBoundary)|\/components\/message\/variants\/(?:RoomMessage|SystemMessage))$/,
					},
					() => ({ path: resolve(here, 'browserLegacyBoundary.tsx') }),
				);
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
const textStyles = sass.compile(resolve(repoRoot, 'packages/fuselage/src/components/Text/Text.styles.scss'), {
	importers: [{ findFileUrl: (url) => (url.startsWith('~') ? pathToFileURL(require.resolve(url.slice(1))) : null) }],
	logger: sass.Logger.silent,
}).css;
const files = new Map(result.outputFiles.map((file) => [`/${file.path.split('/').pop()}`, file.contents]));
files.set('/text.css', textStyles);
const server = createServer((request, response) => {
	if (request.url === '/') {
		response.setHeader('Content-Type', 'text/html');
		response.end(
			'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Message search controller preview</title><link rel="icon" href="data:,"><link rel="stylesheet" href="/preview.css"><link rel="stylesheet" href="/text.css"><style>html,body{margin:0;height:100%;background:#fff}#root{height:720px;display:flex;justify-content:center}body{font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script src="/preview.js"></script></body></html>',
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
	const page = await browser.newPage({ viewport: { width: 620, height: 760 }, timezoneId: 'UTC' });
	page.setDefaultTimeout(15000);
	const errors = [];
	const warnings = [];
	page.on('pageerror', (error) => {
		errors.push(error.message);
		console.error(error.message);
	});
	page.on('console', (message) => {
		if (message.type() === 'error' || message.type() === 'warning') warnings.push(message.text());
	});
	await page.goto(`http://127.0.0.1:${server.address().port}`);
	const input = page.getByRole('textbox', { name: 'Search messages' });
	await input.fill('needle');
	const rows = page.locator('[data-qa="local-message-search-hit"]');
	await rows.nth(2).waitFor();
	assert.equal(await rows.count(), 3);
	assert.equal(await page.getByText('Alice Doe', { exact: true }).count(), 1);
	assert.equal(await page.getByText('budget-2026.pdf', { exact: true }).count(), 1);
	assert.equal(await page.locator('[data-qa="local-search-index-progress"]').textContent(), 'Indexing encrypted history: 12 of 40 rooms');
	assert.equal(await page.getByText(/in memory only/).count(), 0);
	assert.equal(await page.getByText('Encrypted content cannot be searched.', { exact: true }).count(), 0);
	assert.equal(await page.getByText('Global search', { exact: true }).count(), 0);
	const paint = await rows
		.first()
		.evaluate((row) => ({ width: row.getBoundingClientRect().width, height: row.getBoundingClientRect().height }));
	assert.ok(paint.width > 250 && paint.height > 30);
	await page.evaluate(() => document.fonts.ready);
	assert.equal(await page.evaluate(() => document.fonts.check('16px "RocketChat"')), true);
	await rows.first().focus();
	await page.keyboard.press('Enter');
	await page.keyboard.press('Space');
	assert.deepEqual(await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.roomJumps), ['message', 'message']);
	await page.keyboard.press('ArrowDown');
	assert.equal(await rows.nth(1).evaluate((row) => row === document.activeElement), true);
	await page.keyboard.press('ArrowDown');
	assert.equal(await rows.nth(2).evaluate((row) => row === document.activeElement), true);
	await page.keyboard.press('Enter');
	const routes = await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.threadRoutes);
	assert.equal(routes.length, 1);
	assert.deepEqual(routes[0], { name: 'home', params: { rid: 'room', tab: 'thread', context: 'thread' }, search: { msg: 'reply' } });
	await page.screenshot({ path: resolve(outputDirectory, 'local-indexing-results.png'), fullPage: true });
	assert.equal(await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.serverQueries), 0);

	await page.evaluate(() => window.e2eeSearchControllerPreview.show('memory'));
	await page.getByText(/in memory only/).waitFor();
	await input.fill('needle');
	await rows.nth(2).waitFor();
	assert.equal(await page.locator('[data-qa="local-search-index-progress"]').count(), 1);
	await page.screenshot({ path: resolve(outputDirectory, 'memory-indexing-results.png'), fullPage: true });
	await page.evaluate(() => window.e2eeSearchControllerPreview.show('empty'));
	await input.fill('needle');
	await page.getByRole('heading', { name: 'No results found', exact: true }).waitFor();
	assert.equal(await rows.count(), 0);
	assert.equal(await page.locator('.rcx-throbber__circle').count(), 0);
	await page.screenshot({ path: resolve(outputDirectory, 'local-empty.png'), fullPage: true });

	await page.evaluate(() => window.e2eeSearchControllerPreview.show('opening'));
	await input.fill('needle');
	await page.locator('.rcx-throbber__circle').first().waitFor();
	assert.equal(await rows.count(), 0);
	await page.screenshot({ path: resolve(outputDirectory, 'local-opening.png'), fullPage: true });
	const localBeforeUnavailable = await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.localQueries);
	for (const mode of ['locked', 'unavailable']) {
		await page.evaluate((next) => window.e2eeSearchControllerPreview.show(next), mode);
		await page.getByText(mode === 'locked' ? /Local search is locked/ : /Local search is unavailable/).waitFor();
		await input.fill('needle');
		await page.waitForTimeout(400);
		assert.equal(await rows.count(), 0);
		assert.equal(await page.locator('.rcx-throbber__circle').count(), 0);
		assert.equal(await page.getByText('Global search', { exact: true }).count(), 0);
		assert.equal(await page.getByText('Encrypted content cannot be searched.', { exact: true }).count(), 0);
		assert.equal(await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.localQueries), localBeforeUnavailable);
		assert.equal(await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.serverQueries), 0);
		await page.screenshot({ path: resolve(outputDirectory, `local-${mode}.png`), fullPage: true });
	}

	await page.evaluate(() => window.e2eeSearchControllerPreview.show('query-error'));
	await input.fill('needle');
	await page.getByRole('alert').filter({ hasText: 'Search request failed' }).waitFor();
	assert.equal(await rows.count(), 0);
	assert.equal(await page.locator('.rcx-throbber__circle').count(), 0);
	await page.screenshot({ path: resolve(outputDirectory, 'local-query-error.png'), fullPage: true });
	assert.equal(await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.serverQueries), 0);
	await page.evaluate(() => window.e2eeSearchControllerPreview.show('indexing'));
	await input.fill('needle');
	await rows.nth(2).waitFor();
	assert.equal(await page.getByRole('alert').count(), 0);
	const localBeforeLegacy = await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.localQueries);
	assert.equal(await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.serverQueries), 0);

	await page.evaluate(() => window.e2eeSearchControllerPreview.show('legacy'));
	await page.getByText('Encrypted content cannot be searched.', { exact: false }).waitFor();
	await input.fill('needle');
	await page.waitForFunction(() => window.e2eeSearchControllerPreview.evidence.serverQueries >= 2);
	assert.equal(await rows.count(), 0);
	assert.equal(await page.getByText('Global search', { exact: true }).count(), 1);
	assert.equal(await page.locator('[data-qa="local-search-index-progress"]').count(), 0);
	assert.equal(await page.getByText(/in memory only/).count(), 0);
	assert.equal(await page.evaluate(() => window.e2eeSearchControllerPreview.evidence.localQueries), localBeforeLegacy);
	await page.screenshot({ path: resolve(outputDirectory, 'legacy-unsupported.png'), fullPage: true });
	assert.deepEqual(errors, []);
	const evidence = {
		mode: 'production controller and presentational components with controlled session, index, room, and message data',
		browserVersion: browser.version(),
		states: 8,
		screenshots: 8,
		localHits: 3,
		localServerQueries: 0,
		keyboard: { enter: 'PASS', space: 'PASS', arrowDown: 'PASS', threadActivation: 'PASS' },
		indexingStatus: 'PASS',
		memoryStatus: 'PASS',
		localEmpty: 'PASS',
		pendingOpen: 'PASS',
		lockedStatus: 'PASS',
		unavailableStatus: 'PASS',
		queryErrorFeedback: 'PASS',
		controlledQueryRecovery: 'PASS',
		legacyUnsupportedView: 'PASS',
		iconFontLoaded: true,
		rowPaint: paint,
		counters: await page.evaluate(() => window.e2eeSearchControllerPreview.evidence),
		pageErrors: errors,
		consoleWarnings: warnings,
		limitations: [
			'No live workspace, desktop bridge, storage worker, or session lifecycle is exercised.',
			'The legacy preview injects an unsupported state and empty server results. It does not test capability detection or server-message rendering.',
		],
	};
	await writeFile(resolve(outputDirectory, 'evidence.json'), JSON.stringify(evidence, null, 2));
	console.log(JSON.stringify({ ...evidence, outputDirectory }));
} finally {
	await browser?.close();
	await new Promise((closed) => server.close(closed));
}
