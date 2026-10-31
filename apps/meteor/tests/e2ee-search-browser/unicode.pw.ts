import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import type { E2EESearchDoc, E2EESearchHit, E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { startHarnessServer } from './harness';
import type { UnicodeTestWindow } from './unicodePageEntry';

const cases = [
	{ name: 'Hangul', word: '한글검색', exact: ['한글검색', '한글검색'], prefix: ['한글', '한'] },
	{ name: 'ffi ligature', word: 'oﬃce', exact: ['oﬃce', 'office', 'OFFICE'], prefix: ['off', 'oﬃ'] },
	{ name: 'fullwidth', word: 'Ｆｕｌｌｗｉｄｔｈ', exact: ['Ｆｕｌｌｗｉｄｔｈ', 'Fullwidth'], prefix: ['Ｆｕｌｌ', 'full'] },
	{ name: 'Greek accents', word: 'Άλφα', exact: ['Άλφα', 'Άλφα', 'αλφα', 'ΑΛΦΑ'], prefix: ['Άλ', 'αλ'] },
	{ name: 'Latin accents', word: 'café', exact: ['café', 'café', 'cafe', 'CAFÉ'], prefix: ['caf', 'cáf'] },
	{ name: 'decomposed Latin accents', word: 'résumé', exact: ['résumé', 'résumé', 'resume'], prefix: ['ré', 're'] },
	{ name: 'sigma', word: 'ΟΣ', exact: ['ΟΣ', 'ος', 'οσ'], prefix: ['Ο', 'ο'] },
];

const document = (id: string, body: string): E2EESearchDoc => ({
	id,
	rid: 'r',
	uid: 'u',
	username: 'user',
	ts: 10,
	updatedAt: 10,
	kind: 'text',
	body,
});

let server: { url: string; close: () => void };
let page: Page;
let nextNamespace = 0;

test.describe.configure({ mode: 'serial' });
test.beforeAll(async ({ browser }) => {
	server = await startHarnessServer({ entryPoint: join(__dirname, 'unicodePageEntry.ts') });
	page = await browser.newPage();
	await page.goto(server.url);
	await page.waitForFunction(() => 'e2eeSearchUnicodeTest' in window);
});
test.afterAll(async () => {
	await page?.close();
	server?.close();
});

const create = () =>
	page.evaluate(
		(namespace) => (window as unknown as UnicodeTestWindow).e2eeSearchUnicodeTest.create(namespace),
		`unicode-${nextNamespace++}`,
	);
const call = (id: number, method: keyof ISearchIndexBackend, ...args: unknown[]) =>
	page.evaluate(([backendId, name, list]) => (window as unknown as UnicodeTestWindow).e2eeSearchUnicodeTest.call(backendId, name, list), [
		id,
		method,
		args,
	] as const);
const open = (id: number) =>
	page.evaluate(
		(backendId) =>
			(window as unknown as UnicodeTestWindow).e2eeSearchUnicodeTest.call(backendId, 'open', [
				{ userId: 'u', wrapKey: new Uint8Array(32).fill(7) },
			]),
		id,
	) as Promise<E2EESearchOpenResult>;
const exec = (id: number, sql: string) =>
	page.evaluate(([backendId, statement]) => (window as unknown as UnicodeTestWindow).e2eeSearchUnicodeTest.exec(backendId, statement), [
		id,
		sql,
	] as const);

for (const { name, word, exact, prefix } of cases) {
	test(`SQLite matches exact and prefix ${name} queries and preserves original snippets`, async () => {
		const id = await create();
		await open(id);
		await call(id, 'upsert', [document('match', `<${word}> & "'`), document('other', 'unrelated')]);
		for (const text of [...exact, ...prefix]) {
			const hits = (await call(id, 'search', { text })) as E2EESearchHit[];
			expect(
				hits.map((hit) => hit.id),
				text,
			).toEqual(['match']);
			expect(hits[0].snippet, text).toBe(`&lt;<mark>${word}</mark>&gt; &amp; &quot;&#39;`);
			const recent = await call(id, 'searchRecentPage', { text, rid: 'r' });
			expect(recent, text).toEqual({ hits });
		}
		expect(await call(id, 'search', { text: 'notpresent' })).toEqual([]);
		await call(id, 'close');
	});
}

test('SQLite normalizes documents without the query token limit and keeps replacement and removal indexes consistent', async () => {
	const id = await create();
	await open(id);
	const body = `${Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ')} 한글`;
	await call(id, 'upsert', [document('a', body)]);
	expect(((await call(id, 'search', { text: '한글' })) as E2EESearchHit[]).map((hit) => hit.id)).toEqual(['a']);
	await call(id, 'upsert', [document('a', 'oﬃce')]);
	expect(await call(id, 'search', { text: '한글' })).toEqual([]);
	expect(((await call(id, 'search', { text: 'off' })) as E2EESearchHit[]).map((hit) => hit.id)).toEqual(['a']);
	await call(id, 'remove', ['a']);
	expect(await call(id, 'search', { text: 'off' })).toEqual([]);
	await call(id, 'upsert', [document('b', 'Άλφα')]);
	await call(id, 'removeRoom', 'r');
	expect(await exec(id, 'SELECT count(*) AS count FROM docs_fts_normalized')).toEqual([{ count: 0 }]);
	await call(id, 'close');
});

test('SQLite safely resumes migration of a sealed legacy index without losing bodies or checkpoints', async () => {
	const id = await create();
	const body = '한글 oﬃce Ｆｕｌｌｗｉｄｔｈ Άλφα café ΟΣ';
	const docs = Array.from({ length: 205 }, (_, i) => document(`legacy-${String(i).padStart(3, '0')}`, body));
	const checkpoint = { backfillDone: true, lastUpdate: 1234 };
	const state = await page.evaluate(
		([backendId, list, saved]) => (window as unknown as UnicodeTestWindow).e2eeSearchUnicodeTest.seedLegacy(backendId, list, saved),
		[id, docs, checkpoint] as const,
	);
	test.skip(!state.persistent, 'A sealed legacy snapshot requires persistent browser storage');
	await page.evaluate((backendId) => (window as unknown as UnicodeTestWindow).e2eeSearchUnicodeTest.rejectMigrationBatch(backendId, 2), id);
	await expect(open(id)).rejects.toThrow('Test migration batch failure');
	expect(await exec(id, 'SELECT count(*) AS count FROM docs_fts_normalized')).toEqual([{ count: 100 }]);
	expect(await exec(id, 'SELECT id, body FROM docs ORDER BY id')).toEqual(docs.map((doc) => ({ id: doc.id, body: doc.body })));
	await call(id, 'close');

	await open(id);
	expect(await exec(id, 'SELECT count(*) AS count FROM docs_fts_normalized')).toEqual([{ count: 205 }]);
	expect(await exec(id, 'SELECT id, body FROM docs ORDER BY id')).toEqual(docs.map((doc) => ({ id: doc.id, body: doc.body })));
	expect(await call(id, 'stats')).toEqual({ docs: 205, rooms: 1, bytes: new TextEncoder().encode(body).length * 205 });
	expect(await call(id, 'getRoomState', 'r')).toEqual(checkpoint);
	for (const text of ['한글', 'off', 'full', 'αλ', 'cafe', 'οσ']) {
		const hits = (await call(id, 'search', { text, limit: 1 })) as E2EESearchHit[];
		expect(hits).toHaveLength(1);
		expect(hits[0].snippet).toContain('<mark>');
	}
	await call(id, 'close');
	await open(id);
	expect(await call(id, 'getRoomState', 'r')).toEqual(checkpoint);
	expect(await exec(id, 'SELECT count(*) AS count FROM docs_fts_normalized')).toEqual([{ count: 205 }]);
	await call(id, 'upsert', [document(docs[0].id, 'replacement')]);
	await call(id, 'remove', [docs[1].id]);
	expect(await exec(id, 'SELECT count(*) AS count FROM docs_fts_normalized')).toEqual([{ count: 204 }]);
	expect(((await call(id, 'search', { text: 'replacement' })) as E2EESearchHit[]).map((hit) => hit.id)).toEqual([docs[0].id]);
	await call(id, 'close');
});
