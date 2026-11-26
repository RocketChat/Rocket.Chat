import { mock } from './chatConfig';

// The resume credentials the server already issued; never a password, a 2FA code or a typed token.
export type StoredSession = { serverUrl: string; userId: string; authToken: string };

type SecureStoreModule = typeof import('expo-secure-store');

const SESSION_KEY = 'rc-expo-lab.session';
const SERVER_KEY = 'rc-expo-lab.last-server';

const enabled = !mock && process.env.EXPO_PUBLIC_SESSION_STORE !== 'off';
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
		}
	},
};

export const isValidServerUrl = (url: unknown): url is string =>
	typeof url === 'string' && (/^https:\/\/[^\s/]+/i.test(url) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url));

const isNonEmpty = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

// Anything that does not match the versioned shape is discarded, not repaired.
export function parseSession(raw: string | null): StoredSession | undefined {
	if (!raw) return undefined;
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== 'object' || value === null) return undefined;
		const { v, serverUrl, userId, authToken } = value as Record<string, unknown>;
		if (v !== 1 || !isValidServerUrl(serverUrl) || !isNonEmpty(userId) || !isNonEmpty(authToken)) return undefined;
		return { serverUrl, userId, authToken };
	} catch {
		return undefined;
	}
}

// Read synchronously by the login form once loadSession has run.
let lastServerUrl: string | undefined;
export const getLastServerUrl = () => lastServerUrl;

export async function loadSession(key = SESSION_KEY): Promise<StoredSession | undefined> {
	if (!enabled) return undefined;
	const raw = await storage.get(key);
	const session = parseSession(raw);
	if (raw && !session) await storage.del(key);
	if (session) lastServerUrl = session.serverUrl;
	else if (key === SESSION_KEY) {
		const last = await storage.get(SERVER_KEY);
		if (isValidServerUrl(last)) lastServerUrl = last;
	}
	return session;
}

export async function saveSession(session: StoredSession, key = SESSION_KEY): Promise<void> {
	if (!enabled) return;
	await storage.set(key, JSON.stringify({ v: 1, serverUrl: session.serverUrl, userId: session.userId, authToken: session.authToken }));
	if (key === SESSION_KEY) {
		lastServerUrl = session.serverUrl;
		await storage.set(SERVER_KEY, session.serverUrl);
	}
	if (dev) console.log('[session] session saved');
}

export async function clearSession(key = SESSION_KEY): Promise<void> {
	if (!enabled) return;
	await storage.del(key);
	if (dev) console.log('[session] session cleared');
}
