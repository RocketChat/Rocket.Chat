import { DDPSDK } from '@rocket.chat/ddp-client';
import EJSON from 'ejson';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { userIdStore } from '../user';

const stripTrailingSlash = (value: string): string => (value.endsWith('/') ? value.slice(0, -1) : value);

const computeDdpUrl = (): string => {
	const rootUrl = typeof __meteor_runtime_config__ !== 'undefined' ? __meteor_runtime_config__.ROOT_URL : undefined;
	const source = rootUrl && rootUrl !== '/' ? rootUrl : window.location.origin;
	return stripTrailingSlash(source.replace(/^http/, 'ws'));
};

let instance: DDPSDK | undefined;
let connectPromise: Promise<unknown> | undefined;

const applyEjsonEncoding = (sdk: DDPSDK): void => {
	const { ddp } = sdk.client as unknown as { ddp: { encode: unknown; decode: unknown } };
	if (!ddp) return;
	ddp.encode = EJSON.stringify;
	ddp.decode = EJSON.parse;
};

const startConnect = (sdk: DDPSDK): Promise<unknown> => {
	if (connectPromise) return connectPromise;
	connectPromise = sdk.connection.connect().catch((err) => {
		console.warn('[ddpSdk] connect failed', err);
		// Allow a retry on the next call.
		connectPromise = undefined;
	});
	return connectPromise;
};

const waitForConnected = (sdk: DDPSDK): Promise<void> => {
	if (sdk.connection.status === 'connected') return Promise.resolve();
	return new Promise<void>((resolve) => {
		const stop = sdk.connection.on('connected', () => {
			stop();
			resolve();
		});
	});
};

export const getDdpSdk = (): DDPSDK => {
	if (!instance) {
		instance = DDPSDK.create(computeDdpUrl());
		applyEjsonEncoding(instance);
		void startConnect(instance);
	}
	return instance;
};

const readStoredLoginToken = (): string | null => (typeof window !== 'undefined' ? window.localStorage.getItem('Meteor.loginToken') : null);

let inflightLogin: Promise<void> | undefined;

export const ensureConnectedAndAuthenticated = async (): Promise<void> => {
	const sdk = getDdpSdk();

	// IMPORTANT: must wait for the DDP `connected` handshake before issuing
	// any wait-method (login uses wait:true). DDPDispatcher serializes wait
	// blocks at the queue head, so a login dispatched while connecting
	// queues ahead of the connect frame ws.onopen later emits — the connect
	// frame ends up wedged in a non-wait block behind the wait block and
	// never flushes, leaving the socket open but DDP-unhandshaked.
	if (
		sdk.connection.status === 'idle' ||
		sdk.connection.status === 'closed' ||
		sdk.connection.status === 'disconnected' ||
		sdk.connection.status === 'failed'
	) {
		void startConnect(sdk);
	}
	await waitForConnected(sdk);

	const token = readStoredLoginToken();
	if (!token || sdk.account.uid) {
		return;
	}

	if (inflightLogin) {
		await inflightLogin;
		return;
	}

	// Wait for Meteor's own login (resume) flow to settle before issuing our
	// own loginWithToken. Meteor's resume goes through Connection._send →
	// stubMeteorStream → SDK socket and the response triggers
	// adoptAccountFromMeteorLoginResult which sets sdk.account.uid. If we
	// race ahead and call sdk.account.loginWithToken here, the SDK socket
	// receives TWO `login` method frames; ddp-streamer's Account.login
	// has no dedup, so each fires Accounts.onLogin → Presence.newConnection
	// → a duplicate connection in usersSessions. The duplicate stays
	// 'online' while the active one flips to 'away' on idle, and
	// processConnectionStatus prefers ONLINE over AWAY in the aggregate —
	// so auto-away never propagates and the navbar badge stays online.
	const accountsLoggingIn = (Accounts as unknown as { loggingIn?: () => boolean }).loggingIn;
	const start = Date.now();
	while (accountsLoggingIn?.() && Date.now() - start < 2000) {
		await new Promise<void>((resolve) => setTimeout(resolve, 50));
		if (sdk.account.uid) return;
	}
	// One more microtask so the adopt callback (registered as ddp.onResult
	// in the stub) has a chance to fire ahead of us.
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	if (sdk.account.uid) {
		return;
	}

	inflightLogin = (async () => {
		try {
			await sdk.account.loginWithToken(token);
		} finally {
			inflightLogin = undefined;
		}
	})();

	try {
		await inflightLogin;
	} catch (error) {
		if (isAuthError(error) && readStoredLoginToken() === token) {
			// Server rejected the stored token. Without this branch the stored
			// token stays in localStorage forever and the router keeps the user
			// wedged on /home with no main UI and no login form: ddpOverREST
			// routes Meteor's resume login through DDPSDK / REST (not Meteor's
			// own WS), and on rejection the resume invoker errors but the
			// account state isn't cleared automatically. The token-stable
			// guard (readStoredLoginToken() === token) avoids kicking the user
			// out when localStorage was updated mid-flight by a parallel flow
			// (fresh registration, Meteor's own resume) — the 401 is then on a
			// stale token a newer credential already replaced. Drop the local
			// credentials manually instead of calling Meteor.logout(): the
			// latter dispatches a `logout` method which itself races against
			// parallel re-auth flows in CI's parallel-shard environment and
			// kicked otherwise-healthy tests out.
			Accounts._unstoreLoginToken();
			(Meteor.connection as unknown as { setUserId: (uid: string | null) => void }).setUserId(null);
			return;
		}
		console.warn('[ddpSdk] loginWithToken failed', error);
	}
};

const isAuthError = (error: unknown): boolean => {
	if (!error || typeof error !== 'object') return false;
	const e = error as { error?: unknown; reason?: unknown };
	return (
		e.error === 401 ||
		e.error === 403 ||
		e.reason === 'User not found' ||
		e.reason === 'Login token expired' ||
		e.reason === 'You are not allowed to use this token'
	);
};

/**
 * When Meteor.applyAsync('login', ...) is routed through ddpOverREST it lands on
 * DDPSDK as `client.callAsync('login', ...)`. The result authenticates the
 * underlying DDP socket — server-side the session is now logged in — but
 * `sdk.account` is bypassed entirely (only `sdk.account.loginWithToken` populates
 * `account.uid` / `account.user`). Without this sync, our userIdStore subscriber
 * sees uid set, calls ensureConnectedAndAuthenticated, finds `account.uid` empty,
 * and fires a SECOND login on the same socket. The server happily honours both,
 * issuing two different login tokens; whichever arrives second wins on the
 * server but on the client we end up with `account.user.token !== Meteor.loginToken`,
 * which surfaces later as auth-mismatched subscription errors and React crashes
 * mid-flow.
 *
 * Call this from ddpOverREST after a successful 'login' method result so DDPSDK's
 * `account` reflects the same credentials Meteor stored, and ensureConnectedAndAuthenticated
 * short-circuits its own loginWithToken path.
 */
export const adoptAccountFromMeteorLoginResult = (result: unknown): void => {
	if (!result || typeof result !== 'object') return;
	const r = result as { id?: unknown; token?: unknown; tokenExpires?: unknown };
	if (typeof r.id !== 'string' || typeof r.token !== 'string') return;
	const tokenExpiresRaw = r.tokenExpires;
	let tokenExpires: Date | undefined;
	if (tokenExpiresRaw instanceof Date) {
		tokenExpires = tokenExpiresRaw;
	} else if (typeof tokenExpiresRaw === 'object' && tokenExpiresRaw !== null && '$date' in tokenExpiresRaw) {
		const d = (tokenExpiresRaw as { $date: number | string }).$date;
		tokenExpires = new Date(typeof d === 'string' ? parseInt(d, 10) : d);
	}
	const sdk = getDdpSdk();
	sdk.account.user = { ...sdk.account.user, token: r.token, tokenExpires, id: r.id } as typeof sdk.account.user;
	sdk.account.uid = r.id;
};

const teardownAuthenticatedConnection = (): void => {
	if (!instance) return;
	try {
		instance.connection.close();
	} catch {
		// ignore
	}
	instance.account.uid = undefined;
	instance.account.user = undefined;
	connectPromise = undefined;
};

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		__rocketChatSdk?: DDPSDK;
	}
}

if (typeof window !== 'undefined') {
	const sdk = getDdpSdk();
	window.__rocketChatSdk = sdk;

	// Boot-time auth is now driven by Meteor's login resume routed through
	// stubMeteorStream, which calls adoptAccountFromMeteorLoginResult on
	// success. Calling ensureConnectedAndAuthenticated here as well would
	// fire a *second* loginWithToken on the SDK socket before the Meteor
	// resume completes — server-side that ends up as TWO Accounts.onLogin
	// fires → TWO Presence.newConnection inserts in usersSessions, with
	// duplicate entries that confuse processConnectionStatus (one stays
	// online while the other goes away, aggregating to online — auto-away
	// never propagates).

	userIdStore.subscribe((uid) => {
		if (uid) {
			// Subsequent userId transitions (logout → login) still need to
			// re-establish auth on the SDK socket; adopt only kicks in for
			// login frames going through the stub, not for the post-logout
			// re-auth that doesn't necessarily go through Meteor.
			void ensureConnectedAndAuthenticated();
		} else {
			teardownAuthenticatedConnection();
		}
	});
}
