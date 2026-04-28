import { DDPSDK } from '@rocket.chat/ddp-client';
import EJSON from 'ejson';
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
		// eslint-disable-next-line no-console
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

	try {
		await sdk.account.loginWithToken(token);
	} catch (error) {
		if (isAuthError(error) && readStoredLoginToken() === token) {
			// Server rejected the stored token (revoked via force-logout, expired,
			// or user deleted). Without this branch we'd silently swallow the
			// error and the UI would think it's still authenticated — the test
			// suite caught this as e.g. e2ee-passphrase-management not landing on
			// /login after `e2e.resetOwnE2EKey` blanked the user's loginTokens.
			// The token-stable guard (readStoredLoginToken() === token) avoids
			// kicking the user out when localStorage was updated mid-flight by
			// a parallel flow (fresh registration, Meteor's own resume): the
			// 401 is then on a stale token a newer login already replaced.
			// Drive Meteor's logout flow so onLogout callbacks fire (cached
			// stores cleared, router redirects to login). Meteor.logout() will
			// dispatch a `logout` method server-side which the dead session
			// will reject — that's fine, the client-side cleanup runs either
			// way.
			Meteor.logout();
			return;
		}
		// eslint-disable-next-line no-console
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

	if (userIdStore.getState()) {
		void ensureConnectedAndAuthenticated();
	}

	userIdStore.subscribe((uid) => {
		if (uid) {
			void ensureConnectedAndAuthenticated();
		} else {
			teardownAuthenticatedConnection();
		}
	});
}
