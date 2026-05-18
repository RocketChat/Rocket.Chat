import type { DDPSDK } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

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
	// Subscribe to Meteor's underlying WebSocket lifecycle events directly instead
	// of riding Meteor.status's Tracker reactivity. The stream is the canonical
	// non-reactive source: `'reset'` fires when a new DDP session is established
	// (effectively the "connected" signal — see socket-stream-client.js), and
	// `'disconnect'` fires when the WebSocket drops or each retry attempt restarts.
	// `'connected'` is intentionally NOT subscribed: the stream's allowed event
	// list is `['message', 'reset', 'disconnect']` and `on('connected')` throws
	// `Error: unknown event type: connected`. Throwing here would propagate up
	// through `connection.on(...)` callers (notably `CachedStore.performInitialization`)
	// and abort their initialization before `setupListener()` runs, silently
	// breaking real-time stream subscriptions for settings, subscriptions, etc.
	const stream = Meteor.connection?._stream;
	if (!stream || typeof stream.on !== 'function') {
		// Test / SSR environment with a stubbed Meteor — no stream to subscribe to.
		return noopUnsubscribe;
	}
	let stopped = false;
	const handler = (): void => {
		if (!stopped) cb();
	};
	stream.on('reset', handler);
	stream.on('disconnect', handler);
	// Meteor's stream `on` doesn't expose an `off`; flip a flag instead so the
	// stale listener becomes a no-op once stopBridge runs.
	return () => {
		stopped = true;
	};
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

	// Some consumers (`streamerAdapter`) reach into `client.ddp.onMessage` to
	// register listeners on the SDK's underlying socket. With the proxy,
	// Meteor.connection already gets the same frames AND has its own streamer
	// wiring (e.g. `app/notifications/client/lib/Presence.ts:18`), so attaching
	// a second listener here would deliver every Meteor frame twice into
	// streamerCentral. Make this a no-op — meteor-side wiring covers the
	// streams the SDK adapter would otherwise have handled.
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
