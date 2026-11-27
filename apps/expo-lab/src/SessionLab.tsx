import { DDPSDK } from '@rocket.chat/ddp-client';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { login, loginDeps, restore, revokeSession, signOut, signOutWithPrompts, type RestoreDeps, type RestoreState, type Session } from './session';
import { clearSession, isValidServerUrl, loadSession, saveSession, secureStoreAvailable, storage, type StoredSession } from './sessionStore';

// Dev only (EXPO_PUBLIC_SESSION_LAB=1): fake values, under a key the real app never uses.
const LAB_KEY = 'rc-expo-lab.lab-session';
const fake: StoredSession = { serverUrl: 'https://example.invalid', userId: 'fake-user-id', authToken: 'fake-token-not-real', kind: 'password' };
const fakeSession: Session = { sdk: DDPSDK.create(fake.serverUrl), userId: fake.userId, serverUrl: fake.serverUrl, kind: 'password' };

// A stand-in for the SDK that records what is called; no network.
function fakeSdk(opts: { me?: boolean; connect?: boolean } = {}) {
	const calls = { close: 0, post: [] as string[], init: [] as (RequestInit | undefined)[] };
	const sdk = {
		account: { setCredentials: () => undefined },
		rest: {
			get: () => Promise.resolve({ success: opts.me ?? true }),
			post: (path: string, _params?: unknown, init?: RequestInit) => {
				calls.post.push(path);
				calls.init.push(init);
				return Promise.resolve({});
			},
		},
		connection: {
			connect: () => ((opts.connect ?? true) ? Promise.resolve(true) : Promise.reject(new Error('connect failed'))),
			close: () => {
				calls.close++;
			},
		},
	} as unknown as DDPSDK;
	return { sdk, calls };
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Row = { name: string; ok: boolean; detail?: string };

async function storeChecks(): Promise<Row[]> {
	const rows: Row[] = [];
	const check = (name: string, ok: boolean, detail?: string) => rows.push({ name, ok, detail });
	const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

	check('native secure store available', secureStoreAvailable(), secureStoreAvailable() ? 'Keychain' : 'memory fallback');

	await saveSession(fake, LAB_KEY);
	check('save then load round-trips', eq(await loadSession(LAB_KEY), fake));

	await clearSession(LAB_KEY);
	check('delete removes it', (await loadSession(LAB_KEY)) === undefined);

	await storage.set(LAB_KEY, '{not json');
	check('malformed JSON discarded', (await loadSession(LAB_KEY)) === undefined);
	check('malformed JSON deleted from the store', (await storage.get(LAB_KEY)) === null);

	const bad: Record<string, unknown> = {
		'wrong version': { v: 3, ...fake },
		'v2 without kind': { v: 2, ...fake, kind: undefined },
		'v2 bad kind': { v: 2, ...fake, kind: 'admin' },
		'missing token': { v: 1, serverUrl: fake.serverUrl, userId: fake.userId },
		'token not a string': { v: 1, ...fake, authToken: 42 },
		'empty user id': { v: 1, ...fake, userId: '' },
		'plain http server': { v: 2, ...fake, serverUrl: 'http://example.invalid' },
		'not a URL': { v: 2, ...fake, serverUrl: 'javascript:alert(1)' },
		array: [],
		null: null,
	};
	for (const [name, value] of Object.entries(bad)) {
		await storage.set(LAB_KEY, JSON.stringify(value));
		check(`wrong shape discarded: ${name}`, (await loadSession(LAB_KEY)) === undefined);
	}

	await storage.set(LAB_KEY, JSON.stringify({ v: 2, ...fake, serverUrl: 'http://localhost:3000' }));
	check('http localhost accepted', (await loadSession(LAB_KEY))?.serverUrl === 'http://localhost:3000');

	await saveSession(fake, LAB_KEY);
	const raw = (await storage.get(LAB_KEY)) ?? '';
	check('stored JSON holds only v, serverUrl, userId, authToken, kind', eq(Object.keys(JSON.parse(raw)).sort(), ['authToken', 'kind', 'serverUrl', 'userId', 'v']));

	const { kind: _kind, ...v1 } = fake;
	await storage.set(LAB_KEY, JSON.stringify({ v: 1, ...v1 }));
	check('v1 item read as unknown kind', (await loadSession(LAB_KEY))?.kind === 'unknown');

	await clearSession(LAB_KEY);
	check('lab key cleaned up', (await storage.get(LAB_KEY)) === null);
	return rows;
}

async function machineChecks(): Promise<Row[]> {
	const rows: Row[] = [];
	let cleared = 0;
	const deps = (stored: StoredSession | undefined, resume: RestoreDeps['resume']): RestoreDeps => ({
		load: () => Promise.resolve(stored),
		clear: () => {
			cleared++;
			return Promise.resolve();
		},
		resume,
		timeoutMs: 200,
	});
	const run = async (name: string, d: RestoreDeps, expected: RestoreState['status'], expectCleared: number) => {
		cleared = 0;
		const { status } = await restore(d);
		rows.push({ name, ok: status === expected && cleared === expectCleared, detail: `${status}, cleared ${cleared}` });
	};

	await run('nothing stored -> none', deps(undefined, () => Promise.reject(new Error('unused'))), 'none', 0);
	await run('valid -> restored', deps(fake, () => Promise.resolve(fakeSession)), 'restored', 0);
	await run('401 -> rejected, deleted', deps(fake, () => Promise.reject({ status: 401 })), 'rejected', 1);
	await run('403 -> rejected, deleted', deps(fake, () => Promise.reject({ status: 403 })), 'rejected', 1);
	await run('network error -> offline, kept', deps(fake, () => Promise.reject(new TypeError('Network request failed'))), 'offline', 0);
	await run('500 -> offline, kept', deps(fake, () => Promise.reject({ status: 500 })), 'offline', 0);
	await run('hang -> timeout -> offline, kept', deps(fake, () => new Promise(() => undefined)), 'offline', 0);
	return rows;
}

async function urlChecks(): Promise<Row[]> {
	const rows: Row[] = [];
	const rejected = [
		'http://localhost.evil.com',
		'http://localhost@evil.com',
		'http://localhost:3000@evil.com',
		'http://127.0.0.1.evil.com',
		'Https://x.com',
		'https://a@b.com',
		'https://x.com?x',
		'https://x.com#y',
		'https://x.com\\evil.com',
		'http://example.invalid',
	];
	for (const u of rejected) rows.push({ name: `url rejected: ${u}`, ok: !isValidServerUrl(u) });
	for (const u of ['https://example.invalid/', 'https://example.invalid', 'http://localhost:3000', 'http://127.0.0.1:3000/x', 'http://[::1]:3000']) {
		rows.push({ name: `url accepted: ${u}`, ok: isValidServerUrl(u) });
	}
	const noCode = () => Promise.reject(new Error('no code'));
	const token = { kind: 'token', userId: 'fake-user-id', token: 'fake-token-not-real' } as const;
	let created = 0;
	const realCreate = loginDeps.create;
	const realRevoke = loginDeps.revoke;
	try {
		loginDeps.create = (u) => {
			created++;
			return realCreate(u);
		};
		const bad = await login('http://example.invalid', token, noCode, false).then(
			() => 'resolved',
			(e: unknown) => (e instanceof Error ? e.message : '?'),
		);
		rows.push({ name: 'login rejects plain http before creating an SDK', ok: bad.startsWith('Server URL must') && created === 0, detail: bad });

		let sdkUnderTest = fakeSdk();
		loginDeps.create = () => sdkUnderTest.sdk;
		const fail = async (name: string, f: ReturnType<typeof fakeSdk>) => {
			sdkUnderTest = f;
			const err = await login('HTTPS://Example.invalid/', token, noCode, false).then(
				() => 'resolved',
				(e: unknown) => (e instanceof Error ? e.message : '?'),
			);
			rows.push({ name, ok: err !== 'resolved' && f.calls.close === 1, detail: `${err}, close ${f.calls.close}` });
		};
		await fail('login closes the SDK when /v1/me is refused', fakeSdk({ me: false }));
		await fail('login closes the SDK when connect fails', fakeSdk({ connect: false }));
		sdkUnderTest = fakeSdk();
		const ok = await login('HTTPS://Example.invalid/', token, noCode, false);
		rows.push({ name: 'login success keeps the SDK open, scheme lowercased', ok: sdkUnderTest.calls.close === 0 && ok.serverUrl === 'https://Example.invalid', detail: ok.serverUrl });
		rows.push({ name: 'login result carries kind', ok: ok.kind === 'token' });
	} finally {
		loginDeps.create = realCreate;
		loginDeps.revoke = realRevoke;
	}

	const sessionOf = (kind: Session['kind']) => {
		const f = fakeSdk();
		return { f, session: { sdk: f.sdk, userId: 'fake-user-id', serverUrl: fake.serverUrl, kind } satisfies Session };
	};
	for (const kind of ['password', 'token', 'unknown'] as const) {
		const { f, session } = sessionOf(kind);
		let cleared = 0;
		await signOut(session, () => {
			cleared++;
			return Promise.resolve();
		});
		const expectPost = kind === 'password' ? 1 : 0;
		rows.push({ name: `signOut ${kind}: local cleared, close, logout posts ${expectPost}`, ok: cleared === 1 && f.calls.close === 1 && f.calls.post.length === expectPost, detail: `posts ${f.calls.post.length}` });
	}
	{
		const { f, session } = sessionOf('token');
		const err = await signOut(session, () => Promise.reject(new Error('Could not clear the saved session'))).then(
			() => 'resolved',
			(e: unknown) => (e instanceof Error ? e.message : '?'),
		);
		rows.push({ name: 'signOut surfaces a failed delete, still closes', ok: err === 'Could not clear the saved session' && f.calls.close === 1 });
	}

	let seen: { url: string; init?: RequestInit } | undefined;
	await revokeSession(fake, ((url: string, init?: RequestInit) => {
		seen = { url, init };
		return Promise.resolve(new Response());
	}) as typeof fetch);
	rows.push({ name: 'revokeSession posts /api/v1/logout', ok: seen?.url === 'https://example.invalid/api/v1/logout' && seen.init?.method === 'POST' });
	const t0 = Date.now();
	await revokeSession(fake, ((_u: string, init?: RequestInit) => new Promise((_, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('aborted'))))) as typeof fetch, 100);
	rows.push({ name: 'revokeSession gives up after its timeout, no throw', ok: Date.now() - t0 < 1000 });
	return rows;
}

async function hardenedChecks(): Promise<Row[]> {
	const rows: Row[] = [];
	const add = (name: string, ok: boolean, detail?: string) => rows.push({ name, ok, detail });
	const sessionOf = (kind: Session['kind']) => {
		const f = fakeSdk();
		return { f, session: { sdk: f.sdk, userId: fake.userId, serverUrl: fake.serverUrl, kind } satisfies Session };
	};
	const failDelete = () => Promise.reject(new Error('Could not clear the saved session'));

	// Low 1: failed delete, retry at most 3 times
	{
		const { f, session } = sessionOf('token');
		const asked: boolean[] = [];
		let clears = 0;
		await signOutWithPrompts(
			session,
			{ askRevoke: () => Promise.resolve(false), clearFailed: (canRetry) => (asked.push(canRetry), Promise.resolve(true)) },
			() => (clears++, failDelete()),
		);
		add('Low1 retry stops after 3 retries (4 deletes, last alert has no retry)', clears === 4 && JSON.stringify(asked) === '[true,true,true,false]' && f.calls.close === 1, `deletes ${clears}, asked ${asked}`);
	}
	{
		const { f, session } = sessionOf('token');
		let clears = 0;
		let alerts = 0;
		await signOutWithPrompts(
			session,
			{ askRevoke: () => Promise.resolve(false), clearFailed: () => (alerts++, Promise.resolve(true)) },
			() => (clears++, clears < 3 ? failDelete() : Promise.resolve()),
		);
		add('Low1 retry that succeeds ends the chain', clears === 3 && alerts === 2 && f.calls.close === 1, `deletes ${clears}, alerts ${alerts}`);
	}
	{
		const { session } = sessionOf('token');
		let clears = 0;
		await signOutWithPrompts(session, { askRevoke: () => Promise.resolve(false), clearFailed: () => Promise.resolve(false) }, () => (clears++, failDelete()));
		add('Low1 Dismiss does not retry', clears === 1, `deletes ${clears}`);
	}

	// Low 2: unknown kind asks once, the answer picks the revoke
	for (const answer of [true, false]) {
		const { f, session } = sessionOf('unknown');
		let asks = 0;
		await signOutWithPrompts(session, { askRevoke: () => (asks++, Promise.resolve(answer)), clearFailed: () => Promise.resolve(false) }, () => Promise.resolve());
		add(`Low2 unknown, ${answer ? 'Revoke' : 'Only sign out here'}: asked once, logout posts ${answer ? 1 : 0}`, asks === 1 && f.calls.post.length === (answer ? 1 : 0) && f.calls.close === 1, `asks ${asks}, posts ${f.calls.post.length}`);
	}
	for (const kind of ['password', 'token'] as const) {
		const { f, session } = sessionOf(kind);
		let asks = 0;
		await signOutWithPrompts(session, { askRevoke: () => (asks++, Promise.resolve(true)), clearFailed: () => Promise.resolve(false) }, () => Promise.resolve());
		add(`Low2 ${kind} is never asked, posts ${kind === 'password' ? 1 : 0}`, asks === 0 && f.calls.post.length === (kind === 'password' ? 1 : 0));
	}

	// Low 3: manual redirect, non-2xx is not revoked
	const respond = (r: unknown) => ({ seen: [] as (RequestInit | undefined)[], fetch: undefined as unknown as typeof fetch, r });
	for (const [name, response, expected] of [
		['2xx', { ok: true, status: 200, type: 'basic' }, true],
		['302', { ok: false, status: 302, type: 'basic' }, false],
		['opaque redirect', { ok: false, status: 0, type: 'opaqueredirect' }, false],
	] as const) {
		const c = respond(response);
		c.fetch = ((_u: string, init?: RequestInit) => (c.seen.push(init), Promise.resolve(c.r))) as typeof fetch;
		const revoked = await revokeSession(fake, c.fetch);
		add(`Low3 revoke ${name}: redirect manual, revoked ${expected}`, c.seen[0]?.redirect === 'manual' && revoked === expected, `revoked ${revoked}`);
	}
	add('Low3 revoke on a network error is not revoked', !(await revokeSession(fake, (() => Promise.reject(new TypeError('x'))) as typeof fetch)));
	{
		const { f, session } = sessionOf('password');
		await signOut(session);
		add('Low3 sign-out logout passes redirect manual through the SDK', f.calls.init[0]?.redirect === 'manual');
	}

	// Low 4: revoke URL normalization
	for (const [server, expected] of [
		['https://x.example.invalid/websocket', 'https://x.example.invalid/api/v1/logout'],
		['https://x.example.invalid/websocket/', 'https://x.example.invalid/api/v1/logout'],
		['https://x.example.invalid/', 'https://x.example.invalid/api/v1/logout'],
		['https://x.example.invalid/chat', 'https://x.example.invalid/chat/api/v1/logout'],
	]) {
		let url = '';
		await revokeSession({ ...fake, serverUrl: server }, ((u: string) => ((url = u), Promise.resolve({ ok: true }))) as unknown as typeof fetch);
		add(`Low4 revoke URL for ${server}`, url === expected, url);
	}

	// Low 5: an older restore refused after a newer session was saved must not delete it
	{
		const newer: StoredSession = { ...fake, authToken: 'fake-newer-token-not-real' };
		let store: StoredSession | undefined = fake;
		const deps = (): RestoreDeps => ({
			load: () => Promise.resolve(store),
			clear: () => ((store = undefined), Promise.resolve()),
			resume: () => new Promise((_, rej) => setTimeout(() => ((store = newer), rej({ status: 401 })), 50)),
			timeoutMs: 500,
		});
		const [a, b] = await Promise.all([restore(deps()), restore(deps())]);
		add('Low5 older restore 401 after a newer save keeps the newer session', a.status === 'rejected' && b.status === 'rejected' && store === newer, `${a.status} ${b.status} ${store?.authToken === newer.authToken}`);
		store = fake;
		const d = deps();
		d.resume = () => Promise.reject({ status: 401 });
		await restore(d);
		add('Low5 401 with the same stored token still deletes it', store === undefined);
	}
	return rows;
}

async function lateResumeChecks(): Promise<Row[]> {
	const late = fakeSdk();
	await restore({
		load: () => Promise.resolve(fake),
		clear: () => Promise.resolve(),
		resume: () => sleep(300).then(() => ({ ...fakeSession, sdk: late.sdk })),
		timeoutMs: 100,
	});
	await sleep(400);
	return [{ name: 'restore closes the SDK of a resume that resolves after the timeout', ok: late.calls.close === 1, detail: `close ${late.calls.close}` }];
}

export function SessionLab() {
	const [rows, setRows] = useState<Row[]>();

	useEffect(() => {
		(async () => {
			const all = [...(await storeChecks()), ...(await machineChecks()), ...(await urlChecks()), ...(await lateResumeChecks()), ...(await hardenedChecks())];
			for (const r of all) if (!r.ok) console.log(`[session-lab] FAIL ${r.name} (${r.detail ?? ''})`);
			setRows(all);
		})();
	}, []);

	const failed = rows?.filter((r) => !r.ok).length;

	return (
		<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
			<Text style={{ fontSize: 18, fontWeight: '700' }}>Session lab (fake values)</Text>
			<Text style={{ marginBottom: 8 }}>{!rows ? 'Running...' : failed ? `${failed} FAILED` : `all ${rows.length} passed`}</Text>
			{rows?.map((r) => (
				<View key={r.name} style={{ paddingVertical: 0 }}>
					<Text style={{ fontSize: 10, color: r.ok ? 'green' : 'crimson' }}>
						{r.ok ? 'PASS' : 'FAIL'} {r.name}
						{r.detail ? ` (${r.detail})` : ''}
					</Text>
				</View>
			))}
		</ScrollView>
	);
}
