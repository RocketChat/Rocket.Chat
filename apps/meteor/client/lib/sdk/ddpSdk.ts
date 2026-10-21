import { DDPSDK } from '@rocket.chat/ddp-client';
import EJSON from 'ejson';

import { createMeteorBackedSdk, createMeteorBackedStorage } from './meteorBackedSdk';
import { isSdkTransportEnabled } from './sdkTransportEnabled';
import {
	clearLocalSession,
	isLoggingIn,
	onEmailVerificationLink,
	onPageLoadLogin,
	resumeStoredSession,
	subscribeLoggingIn,
} from '../../meteor/accounts';
import { getRootUrl } from '../meteorRuntimeConfig';
import { STORAGE_KEYS, getStoredItem } from './storage';
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

const startConnect = (sdk: DDPSDK): Promise<unknown> => {
	// Only share an in-flight attempt; a settled promise from an earlier connection would turn a manual reconnect into a no-op.
	if (connectPromise && sdk.connection.status === 'connecting') return connectPromise;
	connectPromise = sdk.connection.connect().catch((err) => {
		console.warn('[ddpSdk] connect failed', err);
		// Allow a retry on the next call.
		connectPromise = undefined;
	});
	return connectPromise;
};

export const getDdpSdk = (): DDPSDK => {
	if (!instance) {
		if (sdkTransportEnabled) {
			// Meteor semantics: lost calls are resent after a reconnection, and Meteor's own reconnect login
			// (driven by the stub stream's reset) decides what a refused token means for the session.
			instance = DDPSDK.create(computeDdpUrl(), {
				encode: EJSON.stringify,
				decode: EJSON.parse,
				inFlightMethods: 'resend',
				logoutOnRefusedResume: false,
			});
			// TODO: This is a temporary fix to ensure Accounts/Meteor and Update Session On Window Close work together.
			try {
				instance.storage = createMeteorBackedStorage();
			} catch (error) {
				// DDPSDK.create may return a sealed/frozen instance under strict mode; failing
				// to attach the storage hook must not abort SDK bootstrap.
				console.warn('[ddpSdk] failed to attach storage hook to SDK instance', error);
			}
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

export const readStoredLoginToken = (): string | null => getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

let inflightLogin: Promise<void> | undefined;

export const ensureConnectedAndAuthenticated = async (): Promise<void> => {
	const sdk = getDdpSdk();

	if (
		sdk.connection.status === 'idle' ||
		sdk.connection.status === 'closed' ||
		sdk.connection.status === 'disconnected' ||
		sdk.connection.status === 'failed'
	) {
		void startConnect(sdk);
	}
	try {
		await sdk.connection.whenConnected();
	} catch {
		// Closed before it connected (a logout tearing the connection down): nothing to authenticate.
		return;
	}

	const token = readStoredLoginToken();
	if (!token || sdk.account.uid) {
		return;
	}

	if (inflightLogin) {
		await inflightLogin;
		return;
	}

	// A login already in flight authenticates the socket; a second one would open a duplicate Presence connection.
	if (isLoggingIn()) {
		await new Promise<void>((resolve) => {
			const stop = subscribeLoggingIn(() => {
				if (isLoggingIn()) return;
				stop();
				resolve();
			});
		});
		return;
	}

	// The login goes through the accounts module so the app's user and the SDK account change together.
	inflightLogin = (async () => {
		try {
			await resumeStoredSession(token);
		} finally {
			inflightLogin = undefined;
		}
	})();

	try {
		await inflightLogin;
	} catch (error) {
		console.warn('[ddpSdk] login with the stored token failed', error);
	}
};

/** Drops the session on this client without telling the server, keeping a connection for the logged-out UI. */
export const clearStoredCredentials = (): void => clearLocalSession();

export const isAuthError = (error: unknown): boolean => {
	if (!error || typeof error !== 'object') return false;
	const e = error as { error?: unknown; reason?: unknown; status?: unknown; statusCode?: unknown };
	return (
		e.error === 401 ||
		e.error === 403 ||
		// REST-shaped failures (e.g. sdk.rest.get('/v1/me'), userData stream
		// `nosub`) surface the HTTP status instead of a DDP `error` code.
		e.status === 401 ||
		e.status === 403 ||
		e.statusCode === 401 ||
		e.statusCode === 403 ||
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
	getDdpSdk().account.setCredentials({ id: r.id, token: r.token, tokenExpires: r.tokenExpires as Date | { $date: number } | undefined });
};

const teardownAuthenticatedConnection = (): void => {
	// Closing the socket would fail a login already on it; that login authenticates the socket again.
	if (!instance || isLoggingIn()) return;
	try {
		instance.connection.close();
	} catch {
		// ignore
	}
	instance.account.clearCredentials();
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
	onEmailVerificationLink((token: string) => {
		sdk.account.emit('emailVerificationLink', token);
	});
	onPageLoadLogin((loginAttempt: unknown) => {
		sdk.account.emit('pageLoadLogin', loginAttempt);
	});
}
