import { DDPSDK } from '@rocket.chat/ddp-client';
import { useCallback, useEffect, useState } from 'react';

import { mock } from './chatConfig';
import { clearSession, loadSession, saveSession, type StoredSession } from './sessionStore';
import { loginWithCode, type AskCode } from './twoFactor';

export type Session = { sdk: DDPSDK; userId: string; serverUrl: string };

export type Credentials =
	| { kind: 'password'; username: string; password: string }
	| { kind: 'token'; userId: string; token: string };

const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '');

export async function login(rawUrl: string, credentials: Credentials, askCode: AskCode, persist = true): Promise<Session> {
	const serverUrl = normalizeUrl(rawUrl);
	const sdk = DDPSDK.create(serverUrl);
	if (mock) return { sdk, userId: 'mock', serverUrl };

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

	// The SDK logs in over DDP with this token on every (re)connection.
	sdk.account.setCredentials({ id: userId, token });
	const me = await sdk.rest.get('/v1/me');
	if (!me.success) throw new Error('Login refused');

	await sdk.connection.connect();
	// Only the resume pair is kept; a PAT login yields the same pair as a password login.
	if (persist) await saveSession({ serverUrl, userId, authToken: token });
	return { sdk, userId, serverUrl };
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
	resume: (s) => login(s.serverUrl, { kind: 'token', userId: s.userId, token: s.authToken }, noCode, false),
	timeoutMs: 10000,
};

const isRefused = (e: unknown) => typeof e === 'object' && e !== null && 'status' in e && ((e as { status: unknown }).status === 401 || (e as { status: unknown }).status === 403);

// restoring -> restored | rejected (stored session deleted) | offline (kept, retry) ; none when nothing is stored
export async function restore(deps: RestoreDeps): Promise<RestoreState> {
	const stored = await deps.load();
	if (!stored) return { status: 'none' };
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		const session = await Promise.race([
			deps.resume(stored),
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error('timeout')), deps.timeoutMs);
			}),
		]);
		if (__DEV__) console.log('[session] session restored');
		return { status: 'restored', session };
	} catch (e) {
		if (isRefused(e)) {
			if (__DEV__) console.log('[session] session rejected (' + (e as { status: number }).status + ')');
			await deps.clear();
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
	const run = useCallback(() => {
		setState({ status: 'restoring' });
		restore(deps).then(setState);
	}, [deps]);
	useEffect(run, [run]);
	return { state, retry: run, skip: () => setState({ status: 'none' }) };
}
