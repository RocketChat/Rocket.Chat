import { mock } from './chatConfig';

// kind says how the token was obtained: only a password login owns a token that Sign out may revoke.
// A personal access token is a long-lived credential and is stored as typed; 'unknown' is a v1 item, which could hold either.
export type SessionKind = 'password' | 'token' | 'unknown';
export type StoredSession = { serverUrl: string; userId: string; authToken: string; kind: SessionKind };

type SecureStoreModule = typeof import('expo-secure-store');

const SESSION_KEY = 'rc-expo-lab.session';
const SERVER_KEY = 'rc-expo-lab.last-server';

const labMode = process.env.EXPO_PUBLIC_SESSION_LAB === '1' || process.env.EXPO_PUBLIC_COMPOSER_LAB === '1';
// The real session key is never touched in lab modes; the session lab uses its own key.
const isEnabled = (key: string) => !mock && process.env.EXPO_PUBLIC_SESSION_STORE !== 'off' && (key !== SESSION_KEY || !labMode);
const dev = __DEV__;

// A dev client built before expo-secure-store has no native module: importing it throws, and the app falls back to memory.
let native: SecureStoreModule | undefined;
try {
	native = require('expo-secure-store') as SecureStoreModule;
} catch (e) {
	if (dev) console.warn('[session] secure store unavailable, keeping the session in memory only');
}

export const secureStoreAvailable = () => !!native;

const options = () => ({ keychainAccessible: native?.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
const memory = new Map<string, string>();

// Every call is guarded: a failing Keychain must never break login.
export class ClearFailed extends Error {
	constructor() {
		super('Could not clear the saved session');
	}
}

export const storage = {
	async get(key: string): Promise<string | null> {
		try {
			if (native) return await native.getItemAsync(key, options());
		} catch {
			if (dev) console.warn('[session] secure store read failed');
		}
		return memory.get(key) ?? null;
	},
	async set(key: string, value: string): Promise<void> {
		memory.set(key, value);
		try {
			await native?.setItemAsync(key, value, options());
		} catch {
			if (dev) console.warn('[session] secure store write failed');
		}
	},
	async del(key: string): Promise<void> {
		memory.delete(key);
		try {
			await native?.deleteItemAsync(key, options());
		} catch {
			if (dev) console.warn('[session] secure store delete failed');
			throw new ClearFailed();
		}
	},
};

// The host is lowercased first so only the scheme is case-sensitive; no userinfo, query, fragment or backslash.
export const isValidServerUrl = (url: unknown): url is string => {
	if (typeof url !== 'string') return false;
	const u = url.replace(/^https?:\/\/[^/:?#@\\]*/, (s) => s.toLowerCase());
	return /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[^\s?#@\\]*)?$/.test(u) || /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/[^\s?#@\\]*)?$/.test(u);
};

const isNonEmpty = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

// Anything that does not match the versioned shape is discarded, not repaired.
export function parseSession(raw: string | null): StoredSession | undefined {
	if (!raw) return undefined;
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== 'object' || value === null) return undefined;
		const { v, serverUrl, userId, authToken, kind } = value as Record<string, unknown>;
		if ((v !== 1 && v !== 2) || !isValidServerUrl(serverUrl) || !isNonEmpty(userId) || !isNonEmpty(authToken)) return undefined;
		if (v === 1) return { serverUrl, userId, authToken, kind: 'unknown' };
		if (kind !== 'password' && kind !== 'token' && kind !== 'unknown') return undefined;
		return { serverUrl, userId, authToken, kind };
	} catch {
		return undefined;
	}
}

// Read synchronously by the login form once loadSession has run.
let lastServerUrl: string | undefined;
export const getLastServerUrl = () => lastServerUrl;

export async function loadSession(key = SESSION_KEY): Promise<StoredSession | undefined> {
	if (!isEnabled(key)) return undefined;
	const raw = await storage.get(key);
	const session = parseSession(raw);
	if (raw && !session) await storage.del(key).catch(() => undefined);
	if (session && key === SESSION_KEY) lastServerUrl = session.serverUrl;
	else if (!session && key === SESSION_KEY) {
		const last = await storage.get(SERVER_KEY);
		if (isValidServerUrl(last)) lastServerUrl = last;
	}
	return session;
}

export async function saveSession(session: StoredSession, key = SESSION_KEY): Promise<void> {
	if (!isEnabled(key)) return;
	await storage.set(
		key,
		JSON.stringify({ v: 2, serverUrl: session.serverUrl, userId: session.userId, authToken: session.authToken, kind: session.kind }),
	);
	if (key === SESSION_KEY) {
		lastServerUrl = session.serverUrl;
		await storage.set(SERVER_KEY, session.serverUrl);
	}
	if (dev) console.log('[session] session saved');
}

export async function clearSession(key = SESSION_KEY): Promise<void> {
	if (!isEnabled(key)) return;
	await storage.del(key);
	if (dev) console.log('[session] session cleared');
}
