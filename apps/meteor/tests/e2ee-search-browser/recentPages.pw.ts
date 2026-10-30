import { expect, test } from '@playwright/test';
import type { E2EESearchRecentCursor, E2EESearchRecentPage } from '@rocket.chat/desktop-api';

import { startHarnessServer, type TestWindow } from './harness';

let server: Awaited<ReturnType<typeof startHarnessServer>>;
test.beforeAll(async () => {
	server = await startHarnessServer();
});
test.afterAll(() => server?.close());

test('visits 205 timestamp ties once in UTF-8 binary order with exclusive lookahead cursors', async ({ page }) => {
	await page.goto(server.url);
	await page.waitForFunction(() => 'e2eeSearchTest' in window);
	const result = await page.evaluate(async () => {
		const api = (window as unknown as TestWindow).e2eeSearchTest;
		const id = api.create('recent-ties');
		const call = (method: string, ...args: unknown[]) => api.call(id, method, args);
		const opened = await call('open', { userId: 'u', wrapKey: new Uint8Array(32).fill(3) });
		const ids = [...Array.from({ length: 201 }, (_, n) => `m${String(n).padStart(3, '0')}`), 'Z', 'a', '', '\u{10000}'];
		const docs = ids.map((docId) => ({
			id: docId,
			rid: 'r',
			uid: 'u',
			username: 'alice',
			ts: 1234,
			updatedAt: 1234,
			kind: 'text',
			body: 'needle',
		}));
		await call('upsert', [...docs, { ...docs[0], id: 'excluded', rid: 'other' }, { ...docs[0], id: 'older', ts: 10 }]);
		let cursor: E2EESearchRecentCursor | undefined;
		const visited: string[] = [];
		const sizes: number[] = [];
		do {
			const page = (await call('searchRecentPage', {
				text: 'needle',
				rid: 'r',
				uid: 'u',
				from: 1234,
				to: 1234,
				limit: 100,
				cursor,
			})) as E2EESearchRecentPage;
			visited.push(...page.hits.map((hit) => hit.id));
			sizes.push(page.hits.length);
			if (page.nextCursor) {
				const last = page.hits.at(-1)!;
				if (page.nextCursor.id !== last.id || page.nextCursor.ts !== last.ts) throw new Error('Cursor is not the last hit');
			}
			cursor = page.nextCursor;
		} while (cursor && sizes.length < 10);
		const changed = (await call('searchRecentPage', { text: '', rid: 'other' })) as E2EESearchRecentPage;
		const exhausted = await call('searchRecentPage', { text: 'needle', rid: 'r', from: 1234, cursor: { ts: 1234, id: 'A' } });
		const invalid = await call('searchRecentPage', { text: 'needle', cursor: { ts: NaN, id: 'x' } }).then(
			() => false,
			() => true,
		);
		const capped = (await call('searchRecentPage', { text: 'needle', limit: 1000 })) as E2EESearchRecentPage;
		const defaultPage = (await call('searchRecentPage', { text: 'needle' })) as E2EESearchRecentPage;
		await call('wipe');
		return {
			opened,
			visited,
			sizes,
			changed: changed.hits.map((hit) => hit.id),
			exhausted,
			invalid,
			capped: capped.hits.length,
			defaultSize: defaultPage.hits.length,
		};
	});
	const expected = [...Array.from({ length: 201 }, (_, n) => `m${String(n).padStart(3, '0')}`), 'Z', 'a', '', '\u{10000}'].sort((a, b) =>
		Buffer.compare(Buffer.from(b, 'utf8'), Buffer.from(a, 'utf8')),
	);
	expect(result.opened).toMatchObject({ capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 } });
	expect(result.visited).toEqual(expected);
	expect(new Set(result.visited).size).toBe(205);
	expect(result.sizes).toEqual([100, 100, 5]);
	expect(result.changed).toEqual(['excluded']);
	expect(result.exhausted).toEqual({ hits: [] });
	expect(result.invalid).toBe(true);
	expect(result.capped).toBe(100);
	expect(result.defaultSize).toBe(50);
});
