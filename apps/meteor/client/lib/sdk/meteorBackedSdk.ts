import type { DDPSDK } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { parseDDP } from './ddpProtocol';

/**
 * Meteor-backed pass-through DDPSDK used when the SDK transport is OFF.
 *
 * Returned by `getDdpSdk()` when `isSdkTransportEnabled()` is false. Satisfies
 * the subset of the `DDPSDK` interface that the codebase actually consumes —
 * delegating each call to `Meteor.connection`/`Meteor.callAsync`/`Meteor.userId`
 * etc. — so consumers don't need their own `if (isSdkTransportEnabled())`
 * branches. All operations are no-ops or fall back to Meteor; no second
 * WebSocket is opened, no auth lifecycle is run, no Presence session is
 * duplicated server-side.
 */
const noopUnsubscribe = (): void => undefined;

const safeMeteorStatus = (): { status: string; connected: boolean; retryCount?: number; retryTime?: number } | undefined => {
	if (typeof Meteor.status !== 'function') return undefined;
	try {
		return Meteor.status();
	} catch {
		return undefined;
	}
};

const onMeteorStatusChange = (cb: () => void): (() => void) => {
	// Drive notifications off Meteor.status's Tracker reactivity. Listening to
	// `_stream` events directly misses the `connecting`↔`waiting` transitions
	// and the per-second `retryTime` ticks that Meteor mutates internally
	// without restarting the socket, leaving ConnectionStatusBar stuck on a
	// stale status while reconnection retries run.
	if (typeof Meteor.status !== 'function' || typeof Tracker?.autorun !== 'function') {
		// Test / SSR environment with a stubbed Meteor — nothing to subscribe to.
		return noopUnsubscribe;
	}
	let firstRun = true;
	const computation = Tracker.autorun(() => {
		try {
			Meteor.status();
		} catch {
			return;
		}
		if (firstRun) {
			firstRun = false;
			return;
		}
		cb();
	});
	return () => computation.stop();
};

const meteorStatusToSdkStatus = (): string => {
	const s = safeMeteorStatus();
	if (!s) return 'disconnected';
	if (s.connected) return 'connected';
	switch (s.status) {
		case 'connecting':
			return 'connecting';
		case 'failed':
			return 'failed';
		case 'waiting':
			return 'disconnected';
		case 'offline':
			return 'idle';
		default:
			return 'disconnected';
	}
};

const createMeteorBackedClient = () => {
	const subscribe = (name: string, ...args: Parameters<typeof Meteor.connection.subscribe>) => {
		const sub = Meteor.connection.subscribe(name, ...args);
		// Approximate DDPSDK's Subscription shape with Meteor's handle. The
		// codebase only reads `stop`/`ready`/`isReady`/`id` from it.
		return Object.assign(sub, {
			id: '',
			isReady: false,
			ready: () => Promise.resolve(),
			onChange: () => undefined,
		});
	};

	const callAsync = (method: string, ...args: unknown[]): Promise<unknown> & { id: string } => {
		const promise = Meteor.callAsync(method, ...args) as Promise<unknown> & { id: string };
		// `id` is required on DDPSDK's CallAsync return type; Meteor doesn't
		// surface it, but no caller in this codebase reads it from a Meteor-
		// routed call.
		Object.defineProperty(promise, 'id', { value: '', enumerable: false });
		return promise;
	};

	const onCollection = (id: string, callback: (data: unknown) => void): (() => void) => {
		const handler = (rawMsg: string): void => {
			let msg: unknown;
			try {
				msg = parseDDP(rawMsg);
			} catch {
				return;
			}
			if (typeof msg !== 'object' || msg === null) return;
			if ((msg as { collection?: unknown }).collection !== id) return;
			callback(msg);
		};
		const stream = Meteor.connection._stream!;
		stream.on('message', handler);
		// Meteor's stream `on` doesn't expose an off; the listener is harmless
		// and lives for the page lifetime. Caller's stop is a no-op.
		return noopUnsubscribe;
	};

	// `ddp.onMessage` is reached by code that wants raw DDP frames off the SDK
	// socket. In Meteor-backed mode there is no separate SDK socket; the same
	// frames are already delivered through `onCollection` above (which listens
	// on `Meteor.connection._stream`). Registering a second listener here
	// would double-deliver. The Meteor-backed `onCollection` is also the
	// temporary bridge used by `sdk.onAnyStreamEvent` until SDK transport
	// rollout completes and the Meteor fallback can be removed.
	const ddp = {
		onMessage: (_cb: (payload: unknown) => void): (() => void) => noopUnsubscribe,
	};

	return {
		subscribe,
		callAsync,
		call: (method: string, ...params: unknown[]) => {
			void callAsync(method, ...params);
			return '';
		},
		callWithOptions: (method: string, _opts: unknown, ...params: unknown[]) => {
			void callAsync(method, ...params);
			return '';
		},
		callAsyncWithOptions: (method: string, _opts: unknown, ...params: unknown[]) => callAsync(method, ...params),
		unsubscribe: () => Promise.resolve(),
		connect: () => Promise.resolve(),
		onCollection,
		subscriptions: new Map(),
		ddp,
		// Emitter shape Account inherits from
		on: () => () => undefined,
		off: () => undefined,
		once: () => () => undefined,
		emit: () => undefined,
		events: () => [],
		has: () => false,
	} as unknown as DDPSDK['client'];
};

const createMeteorBackedConnection = () => {
	const emitter = new Emitter<{ connected: void; disconnected: void; connection: void }>();
	let bridgeStarted = false;
	let stopBridge: (() => void) | undefined;
	const startBridge = () => {
		if (bridgeStarted) return;
		bridgeStarted = true;
		let lastConnected = safeMeteorStatus()?.connected ?? false;
		stopBridge = onMeteorStatusChange(() => {
			const nowConnected = safeMeteorStatus()?.connected ?? false;
			if (nowConnected !== lastConnected) {
				lastConnected = nowConnected;
				emitter.emit(nowConnected ? 'connected' : 'disconnected');
			}
			emitter.emit('connection');
		});
	};

	return {
		get status(): string {
			return meteorStatusToSdkStatus();
		},
		on: (event: 'connected' | 'disconnected' | 'connection', cb: () => void): (() => void) => {
			// Lazy-start the Meteor.status() autorun on the first subscriber so
			// modules importing `getDdpSdk` in non-browser test envs don't crash
			// on the absent Meteor.status reactive var.
			startBridge();
			emitter.on(event, cb);
			return () => emitter.off(event, cb);
		},
		off: () => undefined,
		connect: () => Promise.resolve(),
		close: () => {
			if (typeof Meteor.disconnect === 'function') Meteor.disconnect();
			stopBridge?.();
		},
	} as unknown as DDPSDK['connection'];
};

const createMeteorBackedAccount = () => {
	return {
		get uid(): string | undefined {
			if (typeof Meteor.userId !== 'function') return undefined;
			try {
				return Meteor.userId() ?? undefined;
			} catch {
				return undefined;
			}
		},
		set uid(_v: string | undefined) {
			// no-op — Meteor owns the userId
		},
		get user() {
			if (typeof Meteor.user !== 'function') return undefined;
			let u;
			try {
				u = Meteor.user();
			} catch {
				return undefined;
			}
			if (!u) return undefined;
			return u as unknown as { id: string; username?: string; token?: string; tokenExpires?: Date };
		},
		set user(_v) {
			// no-op — Meteor owns the user
		},
		loginWithPassword: (username: string, password: string) =>
			new Promise<void>((resolve, reject) =>
				(Meteor as unknown as { loginWithPassword: (u: string, p: string, cb: (err?: unknown) => void) => void }).loginWithPassword(
					username,
					password,
					(err) => (err ? reject(err) : resolve()),
				),
			),
		loginWithToken: (token: string) =>
			new Promise<{ id: string; token: string; tokenExpires: Date }>((resolve, reject) =>
				(Meteor as unknown as { loginWithToken: (t: string, cb: (err?: unknown, res?: unknown) => void) => void }).loginWithToken(
					token,
					(err, res) => (err ? reject(err) : resolve(res as { id: string; token: string; tokenExpires: Date })),
				),
			),
		logout: () =>
			new Promise<void>((resolve, reject) =>
				(Meteor as unknown as { logout: (cb: (err?: unknown) => void) => void }).logout((err) => (err ? reject(err) : resolve())),
			),
		// Lifecycle handlers delegate to Meteor's accounts-base. The unsubscribe
		// shape (returning a () => void) matches the SDK contract; Meteor's
		// onLogin/onLogout hand back a `{ stop }` handle, while
		// onEmailVerificationLink/onPageLoadLogin don't expose an unsubscribe at
		// all — call sites for those are singletons registered at module load,
		// so a no-op unsubscribe is acceptable.
		onLogin: (fn: () => void): (() => void) => {
			const handle = Accounts.onLogin(fn);
			return () => handle.stop();
		},
		onLogout: (fn: () => void): (() => void) => {
			// @types/meteor declares onLogout's return as void, but at runtime it
			// returns the same `{ stop }` handle as onLogin (Meteor source:
			// packages/accounts-base/accounts_common.js).
			const handle = (Accounts.onLogout as unknown as (fn: () => void) => { stop: () => void })(fn);
			return () => handle.stop();
		},
		onEmailVerificationLink: (fn: (token: string) => void): (() => void) => {
			Accounts.onEmailVerificationLink(fn);
			return () => undefined;
		},
		onPageLoadLogin: (fn: (loginAttempt: unknown) => void): (() => void) => {
			Accounts.onPageLoadLogin(fn);
			return () => undefined;
		},
		// Emitter shape Account inherits from
		on: () => () => undefined,
		off: () => undefined,
		once: () => () => undefined,
		emit: () => undefined,
		events: () => [],
		has: () => false,
	} as unknown as DDPSDK['account'];
};

export const createMeteorBackedSdk = (): DDPSDK => {
	const connection = createMeteorBackedConnection();
	const client = createMeteorBackedClient();
	const account = createMeteorBackedAccount();

	return {
		connection,
		client,
		account,
		timeoutControl: undefined,
		rest: undefined,
		call: (method: string, ...params: unknown[]) => client.callAsync(method, ...params),
		stream: () => {
			throw new Error('SDK transport is disabled — use sdk.publish/sdk.stream from SDKClient.ts instead');
		},
	} as unknown as DDPSDK;
};
