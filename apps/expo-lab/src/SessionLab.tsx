import { DDPSDK } from '@rocket.chat/ddp-client';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { restore, type RestoreDeps, type RestoreState, type Session } from './session';
import { clearSession, loadSession, saveSession, secureStoreAvailable, storage, type StoredSession } from './sessionStore';

// Dev only (EXPO_PUBLIC_SESSION_LAB=1): fake values, under a key the real app never uses.
const LAB_KEY = 'rc-expo-lab.lab-session';
const fake: StoredSession = { serverUrl: 'https://example.invalid', userId: 'fake-user-id', authToken: 'fake-token-not-real' };
const fakeSession: Session = { sdk: DDPSDK.create(fake.serverUrl), userId: fake.userId, serverUrl: fake.serverUrl };

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
		'wrong version': { v: 2, ...fake },
		'missing token': { v: 1, serverUrl: fake.serverUrl, userId: fake.userId },
		'token not a string': { v: 1, ...fake, authToken: 42 },
		'empty user id': { v: 1, ...fake, userId: '' },
		'plain http server': { v: 1, ...fake, serverUrl: 'http://example.invalid' },
		'not a URL': { v: 1, ...fake, serverUrl: 'javascript:alert(1)' },
		array: [],
		null: null,
	};
	for (const [name, value] of Object.entries(bad)) {
		await storage.set(LAB_KEY, JSON.stringify(value));
		check(`wrong shape discarded: ${name}`, (await loadSession(LAB_KEY)) === undefined);
	}

	await storage.set(LAB_KEY, JSON.stringify({ v: 1, ...fake, serverUrl: 'http://localhost:3000' }));
	check('http localhost accepted', (await loadSession(LAB_KEY))?.serverUrl === 'http://localhost:3000');

	await saveSession(fake, LAB_KEY);
	const raw = (await storage.get(LAB_KEY)) ?? '';
	check('stored JSON holds only v, serverUrl, userId, authToken', eq(Object.keys(JSON.parse(raw)).sort(), ['authToken', 'serverUrl', 'userId', 'v']));

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

export function SessionLab() {
	const [rows, setRows] = useState<Row[]>();

	useEffect(() => {
		(async () => {
			setRows([...(await storeChecks()), ...(await machineChecks())]);
		})();
	}, []);

	const failed = rows?.filter((r) => !r.ok).length;

	return (
		<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 64 }}>
			<Text style={{ fontSize: 18, fontWeight: '700' }}>Session lab (fake values)</Text>
			<Text style={{ marginBottom: 8 }}>{!rows ? 'Running...' : failed ? `${failed} FAILED` : `all ${rows.length} passed`}</Text>
			{rows?.map((r) => (
				<View key={r.name} style={{ paddingVertical: 2 }}>
					<Text style={{ fontSize: 12, color: r.ok ? 'green' : 'crimson' }}>
						{r.ok ? 'PASS' : 'FAIL'} {r.name}
						{r.detail ? ` (${r.detail})` : ''}
					</Text>
				</View>
			))}
		</ScrollView>
	);
}
