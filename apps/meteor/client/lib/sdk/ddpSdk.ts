import { DDPSDK } from '@rocket.chat/ddp-client';
import EJSON from 'ejson';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { createMeteorBackedSdk } from './meteorBackedSdk';
import { isSdkTransportEnabled } from './sdkTransportEnabled';
import { getRootUrl } from '../meteorRuntimeConfig';
import { STORAGE_KEYS, getStoredItem, removeStoredItem } from './storage';
import { userIdStore } from '../user';

const sdkTransportEnabled = isSdkTransportEnabled();

const stripTrailingSlash = (value: string): string => (value.endsWith('/') ? value.slice(0, -1) : value);

const computeDdpUrl = (): string => {
	const rootUrl = getRootUrl();
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
		if (sdkTransportEnabled) {
			instance = DDPSDK.create(computeDdpUrl());
			applyEjsonEncoding(instance);
			void startConnect(instance);
		} else {
			// Meteor-backed pass-through. Same DDPSDK shape, but every call
			// delegates to Meteor.connection / Meteor.callAsync / Meteor.userId
			// — no second WebSocket opened, no auth lifecycle, no Presence
			// session duplicated server-side. Lets ServerProvider, presence.ts,
			// SDKClient, etc. continue calling getDdpSdk() unconditionally
			// without per-call-site flag gates.
			instance = createMeteorBackedSdk();
		}
	}
	return instance;
};

const readStoredLoginToken = (): string | null => getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

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

	// Give Meteor's own login flow (resume routed through stubMeteorStream
	// + adoptAccountFromMeteorLoginResult) time to populate sdk.account
	// before we issue our own loginWithToken. If adopt fires first, we can
	// short-circuit and avoid sending a second login frame on the SDK
	// socket — which would otherwise create a duplicate Presence
	// connection (processConnectionStatus prefers ONLINE over AWAY in the
	// aggregate, breaking the auto-away flow). 500ms covers a single
	// server roundtrip in CI; if the stub-routed login hasn't completed by
	// then, fall back to issuing our own loginWithToken below.
	for (let i = 0; i < 20 && !sdk.account.uid; i++) {
		await new Promise<void>((resolve) => setTimeout(resolve, 25));
	}
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
			removeStoredItem(STORAGE_KEYS.USER_ID);
			removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
			removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES);
			Meteor.connection.setUserId(null);
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

if (typeof window !== 'undefined' && isSdkTransportEnabled()) {
	console.info(
		'%c[Rocket.Chat] SDK-over-DDP transport enabled (experimental)',
		'color:#fff;background:#f5455c;padding:2px 6px;border-radius:3px;font-weight:bold',
	);
	const sdk = getDdpSdk();
	window.__rocketChatSdk = sdk;

	// DDPSDK auto-fires loginWithToken on every `connected` event using the
	// in-memory account.user.token (DDPSDK.create line 115-122). When the
	// server force-logs the user out (resetUserE2EKey →
	// Users.unsetLoginTokens → meteor.service force_logout listener closes
	// the user's WebSocket sessions), the SDK reconnects and immediately
	// retries the now-dead token. DDPSDK calls this with `void` so the
	// rejection is swallowed; account.user stays populated, Meteor.userId()
	// stays set, and the navbar continues to render Home with stale creds.
	//
	// Wrap account.loginWithToken so we can observe rejections from the
	// auto-retry. To avoid breaking the SAML/password login flows where a
	// fresh login is concurrently in flight, only act when:
	//  - the error is auth-shaped (`isAuthError`) AND
	//  - the token in localStorage still matches the one we tried with
	//    (nothing rotated it mid-flight) AND
	//  - the SDK account didn't get refreshed by a successful adopt while
	//    we were awaiting (sdk.account.uid still maps to this token's user)
	// Wrap account.loginWithToken so the SDK's auto-relogin rejection (called
	// with `void` in DDPSDK.create) doesn't surface as an unhandled rejection
	// (window.onunhandledrejection → pageError). The actual recovery from a
	// failed auto-relogin is now driven by Meteor's `DDP.onReconnect`
	// callback (registered by `callLoginMethod`), which fires after
	// stubMeteorStream re-emits `reset` on each SDK 'connected' event. That
	// callback retries login with the latest stored token and calls
	// `makeClientLoggedOut` on failure — no need to duplicate that logic.
	const account = sdk.account as unknown as { loginWithToken: (token: string) => Promise<unknown> };
	const originalLogin = account.loginWithToken.bind(sdk.account);
	account.loginWithToken = async (token: string) => {
		try {
			return await originalLogin(token);
		} catch (error) {
			if (isAuthError(error)) {
				// Meteor's onReconnect path will retry through stubMeteorStream
				// with the current localStorage token; nothing for us to do here
				// beyond not letting the rejection escape.
				return undefined;
			}
			throw error;
		}
	};

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

	// Bridge Meteor's URL-routing-based account events into the SDK so
	// sdk.account.onEmailVerificationLink / onPageLoadLogin fire in flag-ON
	// mode too. The SDK has no native source for these — they come from
	// Meteor's hash-route parser (verification link) and Meteor's first-login
	// resolution (page load login). Register one bridge per event; AccountImpl's
	// emitter fans out to whatever consumers attached via onEmailVerificationLink
	// / onPageLoadLogin.
	Accounts.onEmailVerificationLink((token: string) => {
		sdk.account.emit('emailVerificationLink', token);
	});
	Accounts.onPageLoadLogin((loginAttempt: unknown) => {
		sdk.account.emit('pageLoadLogin', loginAttempt);
	});
}
