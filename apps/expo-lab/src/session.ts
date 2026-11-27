import { DDPSDK } from '@rocket.chat/ddp-client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mock } from './chatConfig';
import { clearSession, isValidServerUrl, loadSession, saveSession, type SessionKind, type StoredSession } from './sessionStore';
import { loginWithCode, type AskCode } from './twoFactor';

export type Session = { sdk: DDPSDK; userId: string; serverUrl: string; kind: SessionKind };

export type Credentials =
	| { kind: 'password'; username: string; password: string }
	| { kind: 'token'; userId: string; token: string };

const normalizeUrl = (url: string) =>
	url
		.trim()
		.replace(/\/+$/, '')
		.replace(/^[a-z]+:/i, (scheme) => scheme.toLowerCase());

// Test hook: the lab swaps the SDK factory to run login without a network.
export const loginDeps = { create: (url: string): DDPSDK => DDPSDK.create(url), revoke: (s: StoredSession) => revokeSession(s) };
// The lab swaps these in dev builds only.
if (!__DEV__) Object.freeze(loginDeps);

// Same normalization as toRestUrl in packages/ddp-client/src/DDPSDK.ts (not exported there).
const toRestUrl = (url: string) => url.replace(/\/websocket\/?$/, '').replace(/\/$/, '');

// Best effort and bounded: signing in must never wait on the server we are leaving.
// 'redirect: manual' is passed but React Native's fetch does not enforce it, so a redirect may be followed with the auth headers.
// Only a 2xx answered from the stored server's origin counts as revoked; an empty or foreign response URL means not revoked.
export async function revokeSession(stored: StoredSession, request: typeof fetch = fetch, timeoutMs = 3000): Promise<boolean> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await request(`${toRestUrl(stored.serverUrl)}/api/v1/logout`, {
			method: 'POST',
			headers: { 'X-User-Id': stored.userId, 'X-Auth-Token': stored.authToken },
			redirect: 'manual',
			signal: controller.signal,
		});
		return response.ok && new URL(response.url).origin === new URL(toRestUrl(stored.serverUrl)).origin;
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}

export async function login(rawUrl: string, credentials: Credentials, askCode: AskCode, persist = true): Promise<Session> {
	const serverUrl = normalizeUrl(rawUrl);
	if (!isValidServerUrl(serverUrl)) throw new Error('Server URL must start with https:// (http:// only for localhost)');
	const sdk = loginDeps.create(serverUrl);
	if (mock) return { sdk, userId: 'mock', serverUrl, kind: credentials.kind };

	try {
		let userId: string;
		let token: string;
		if (credentials.kind === 'password') {
			const data = await loginWithCode(sdk.rest, credentials.username, credentials.password, askCode);
			userId = data.userId;
			token = data.authToken;
		} else {
			userId = credentials.userId;
			token = credentials.token;
		}
		if (!userId || !token) throw new Error('Login refused');

		// The SDK logs in over DDP with this token on every (re)connection.
		sdk.account.setCredentials({ id: userId, token });
		const me = await sdk.rest.get('/v1/me');
		if (!me.success) throw new Error('Login refused');

		await sdk.connection.connect();
		if (persist) {
			// The previous password login's token is revoked; a PAT or unknown one is shared and never touched.
			const previous = await loadSession();
			if (previous?.kind === 'password' && previous.authToken !== token) void loginDeps.revoke(previous);
			await saveSession({ serverUrl, userId, authToken: token, kind: credentials.kind });
		}
		return { sdk, userId, serverUrl, kind: credentials.kind };
	} catch (e) {
		sdk.connection.close();
		throw e;
	}
}

// Sign out: the local copy always goes. The server-side token is revoked only for a password login:
// /v1/logout removes the token from the user's login tokens, which is where personal access tokens live too.
export async function signOut(session: Session | undefined, clear: () => Promise<void> = clearSession, revoke = session?.kind === 'password'): Promise<void> {
	let failure: unknown;
	try {
		await clear();
	} catch (e) {
		failure = e;
	}
	// The init is forwarded by the SDK's REST client; React Native does not enforce it.
	if (revoke) session?.sdk.rest.post('/v1/logout', undefined, { redirect: 'manual' }).catch(() => undefined);
	try {
		session?.sdk.connection.close();
	} catch {
		// best effort: a failing close is not a clear failure
	}
	if (failure) throw failure;
}

export type SignOutUi = {
	askRevoke: () => Promise<boolean>;
	// Resolves true to retry the delete; canRetry is false once the retries are used up.
	clearFailed: (canRetry: boolean) => Promise<boolean>;
};

const MAX_CLEAR_RETRIES = 3;

// A password session is always revoked, a PAT never; an old v1 item of unknown origin is the user's call, asked once and not stored.
export async function signOutWithPrompts(session: Session | undefined, ui: SignOutUi, clear: () => Promise<void> = clearSession): Promise<void> {
	// For 'unknown' the delete starts before the prompt, so killing the app at the prompt cannot restore the session.
	const early = session?.kind === 'unknown' ? clear().then(() => undefined, (e: unknown) => e) : undefined;
	const revoke = session?.kind === 'unknown' ? await ui.askRevoke() : session?.kind === 'password';
	let failure: unknown;
	try {
		await signOut(session, early ? () => Promise.resolve() : clear, revoke);
	} catch (e) {
		failure = e;
	}
	if (early) failure = await early;
	for (let retries = 0; failure; retries++) {
		const canRetry = retries < MAX_CLEAR_RETRIES;
		if (!(await ui.clearFailed(canRetry)) || !canRetry) return;
		failure = await clear().then(
			() => undefined,
			(e: unknown) => e,
		);
	}
}

export type RestoreState =
	| { status: 'restoring' }
	| { status: 'none' }
	| { status: 'restored'; session: Session }
	| { status: 'rejected' }
	| { status: 'offline' };

export type RestoreDeps = {
	load: () => Promise<StoredSession | undefined>;
	clear: () => Promise<void>;
	resume: (stored: StoredSession) => Promise<Session>;
	timeoutMs: number;
};

const noCode: AskCode = () => Promise.reject(new Error('no code'));

export const defaultRestoreDeps: RestoreDeps = {
	load: () => loadSession(),
	clear: () => clearSession(),
	resume: (s) => login(s.serverUrl, { kind: 'token', userId: s.userId, token: s.authToken }, noCode, false).then((r) => ({ ...r, kind: s.kind })),
	timeoutMs: 10000,
};

const isRefused = (e: unknown) => typeof e === 'object' && e !== null && 'status' in e && ((e as { status: unknown }).status === 401 || (e as { status: unknown }).status === 403);

// restoring -> restored | rejected (stored session deleted) | offline (kept, retry) ; none when nothing is stored
export async function restore(deps: RestoreDeps): Promise<RestoreState> {
	const stored = await deps.load();
	if (!stored) return { status: 'none' };
	let timer: ReturnType<typeof setTimeout> | undefined;
	let timedOut = false;
	const attempt = deps.resume(stored);
	try {
		const session = await Promise.race([
			attempt,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => {
					timedOut = true;
					reject(new Error('timeout'));
				}, deps.timeoutMs);
			}),
		]);
		if (__DEV__) console.log('[session] session restored');
		return { status: 'restored', session };
	} catch (e) {
		// A late success must not leave an open connection behind; a late failure closed its own in login.
		if (timedOut) attempt.then((late) => late.sdk.connection.close(), () => undefined);
		if (isRefused(e)) {
			if (__DEV__) console.log('[session] session rejected (' + (e as { status: number }).status + ')');
			// A newer login may have saved another session while this attempt was in flight.
			const current = await deps.load().catch(() => undefined);
			if (current?.authToken === stored.authToken) await deps.clear().catch(() => undefined);
			return { status: 'rejected' };
		}
		if (__DEV__) console.log('[session] server unreachable, session kept');
		return { status: 'offline' };
	} finally {
		clearTimeout(timer);
	}
}

export function useRestoreSession(deps: RestoreDeps = defaultRestoreDeps) {
	const [state, setState] = useState<RestoreState>({ status: 'restoring' });
	const current = useRef(0);
	const run = useCallback(() => {
		const id = ++current.current;
		setState({ status: 'restoring' });
		restore(deps).then((next) => {
			if (id === current.current) setState(next);
			else if (next.status === 'restored') next.session.sdk.connection.close();
		});
	}, [deps]);
	useEffect(run, [run]);
	return {
		state,
		retry: run,
		skip: () => {
			current.current++;
			setState({ status: 'none' });
		},
	};
}
