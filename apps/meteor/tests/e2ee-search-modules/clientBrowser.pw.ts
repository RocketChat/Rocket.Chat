import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import type { ClientBrowserWindow } from './clientBrowserEntry';
import { startHarnessServer } from '../e2ee-search-browser/harness';

let server: Awaited<ReturnType<typeof startHarnessServer>>;
test.beforeAll(async () => {
	server = await startHarnessServer({
		entryPoint: resolve(__dirname, 'clientBrowserEntry.ts'),
		alias: { '@rocket.chat/core-typings': resolve(__dirname, 'coreTypings.ts') },
	});
});
test.afterAll(() => server?.close());

test('uses client indexing, catch-up, queries and session handles with the real SQLite worker', async ({ page }) => {
	await page.goto(server.url);
	await page.waitForFunction(() => 'e2eeSearchClientTest' in window);
	const result = await page.evaluate(() => (window as unknown as ClientBrowserWindow).e2eeSearchClientTest.run());
	const expected = [...Array.from({ length: 203 }, (_, n) => `m${String(n).padStart(3, '0')}`), '', '\u{10000}'].sort((a, b) =>
		Buffer.compare(Buffer.from(b, 'utf8'), Buffer.from(a, 'utf8')),
	);
	expect(result.before).toEqual(expected);
	const expectedAfter = [...expected.filter((id) => !['m000', 'm001', 'm002'].includes(id)), 'new'].sort((a, b) =>
		Buffer.compare(Buffer.from(b, 'utf8'), Buffer.from(a, 'utf8')),
	);
	expect(result.after).toEqual(expectedAfter);
	expect(result.state).toEqual({ backfillDone: true, lastUpdate: 3000 });
	expect(result.calls).toEqual([
		{ type: 'UPDATED', next: '1000_' },
		{ type: 'DELETED', next: '1000_' },
	]);
	expect(result.sessions).toContain('current');
	expect(result.sessions).not.toContain('stale');
	expect(result.restored).toEqual(result.sessions);
});

test('retains the sealed index on logout and deletes it after consent withdrawal through real session wiring', async ({ page }) => {
	await page.goto(server.url);
	await page.waitForFunction(() => 'e2eeSearchClientTest' in window);
	const result = await page.evaluate(() => (window as unknown as ClientBrowserWindow).e2eeSearchClientTest.runSessionLifecycle());
	expect(result).toEqual({ revoked: true, restored: ['kept'], inactive: true, docsAfterOptOut: 0, errors: [] });
});
