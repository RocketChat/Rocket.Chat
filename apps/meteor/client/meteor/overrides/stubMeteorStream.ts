import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { type DDPMessage, parseDDP, stringifyDDP } from '../../lib/sdk/ddpProtocol';
import { adoptAccountFromMeteorLoginResult, getDdpSdk } from '../../lib/sdk/ddpSdk';
import { isSdkTransportEnabled } from '../../lib/sdk/sdkTransportEnabled';

/**
 * Replace Meteor.connection._stream with a stub that pretends to be a
 * connected DDP stream and forwards outbound frames through the DDPSDK
 * socket. The goal: only one WebSocket per page (the DDPSDK one). Meteor
 * still owns its Connection / MethodInvoker / _streamHandlers machinery —
 * we just swap the transport underneath.
 *
 * What goes through here:
 *  - method frames bypassed by ddpOverREST (login resume, UserPresence:*,
 *    setUserStatus, logout) — routed via the SDK socket so they hit
 *    ddp-streamer's native handlers.
 *  - sub/unsub frames Meteor sends internally (resubscriptions on reset,
 *    bootstrap subs that escape Meteor.connection.subscribe) — routed via
 *    the SDK socket; the responses (ready/nosub/added/changed) are bridged
 *    back to Meteor's _streamHandlers in ddpSdkCollectionBridge.
 *  - ping frames from Meteor's heartbeat — answered locally with a synthetic
 *    pong fed back into _streamHandlers so the heartbeat stays satisfied.
 *  - connect/pong frames — discarded; the SDK socket has its own handshake.
 */

if (isSdkTransportEnabled()) {
	installStubMeteorStream();
}

function installStubMeteorStream(): void {
	const conn = Meteor.connection;

	const realStream = conn._stream!;

	// Carry Meteor's already-registered handlers (registered in the Connection
	// constructor BEFORE we got a chance to swap `_stream`) over to the stub —
	// onMessage, onReset, onDisconnect all live in `realStream.eventCallbacks`.
	const inheritedCallbacks = realStream.eventCallbacks ?? {};

	// Drop Meteor's WS. The stub takes over before any user code is gated on
	// _stream._connected, so closing the real socket does not strand any send().
	try {
		realStream.disconnect({ _permanent: true });
	} catch {
		// already closed / never opened
	}

	const eventCallbacks: Record<string, Array<(...args: any[]) => void>> = Object.create(null);
	for (const [name, callbacks] of Object.entries(inheritedCallbacks)) {
		eventCallbacks[name] = callbacks.slice();
	}
	const fire = (name: string, ...args: any[]): void => {
		const list = eventCallbacks[name];
		if (!list) return;
		list.slice().forEach((cb) => cb(...args));
	};

	const TrackerDependency = (Tracker as unknown as { Dependency?: new () => { changed(): void } }).Dependency;
	const statusListeners = TrackerDependency ? new TrackerDependency() : undefined;

	conn._stream = {
		currentStatus: {
			status: 'connected',
			connected: true,
			retryCount: 0,
		},

		eventCallbacks: eventCallbacks as NonNullable<typeof conn._stream>['eventCallbacks'],
		statusListeners,

		on(name, callback) {
			if (name !== 'message' && name !== 'reset' && name !== 'disconnect') {
				throw new Error(`unknown event type: ${name}`);
			}
			(eventCallbacks[name] ||= []).push(callback);
		},

		forEachCallback(name, cb) {
			(eventCallbacks[name] || []).slice().forEach(cb);
		},

		send(data) {
			let frame: { msg?: string; id?: string; method?: string; name?: string; params?: unknown[] } | undefined;
			try {
				frame = parseDDP(data) as typeof frame;
			} catch {
				return;
			}
			if (!frame || typeof frame.msg !== 'string') return;
			void routeOutbound(frame);
		},

		status() {
			statusListeners?.changed?.();
			return this.currentStatus;
		},

		statusChanged() {
			statusListeners?.changed?.();
		},

		reconnect() {
			// SDK owns reconnection; no-op here.
		},
		disconnect() {
			// SDK owns disconnection; no-op so Meteor.disconnect() is harmless.
		},
		_lostConnection() {
			// Nothing to do — heartbeat over the stub never times out.
		},
	};

	const bridgePongFor = (id?: string): void => {
		conn._streamHandlers.onMessage(stringifyDDP({ msg: 'pong', ...(id != null && { id }) } as unknown as DDPMessage));
	};

	type SdkDdp = {
		emit(event: string, payload: unknown): void;
		onResult(id: string, cb: (payload: { msg: 'result'; id: string; error?: unknown; result?: unknown }) => void): () => void;
	};

	const routeOutbound = (frame: { msg?: string; id?: string; method?: string; name?: string; params?: unknown[] }): void => {
		const sdk = getDdpSdk();
		const { ddp } = sdk.client as unknown as { ddp: SdkDdp };

		switch (frame.msg) {
			case 'connect':
				// SDK already negotiated DDP version on its own socket.
				return;
			case 'pong':
				return;
			case 'ping':
				bridgePongFor(frame.id);
				return;
			case 'method':
				// Meteor's `login` resume goes through here. The SDK socket session
				// is authenticated server-side by the resume frame, but `sdk.account`
				// only gets populated by `sdk.account.loginWithToken`. Without
				// adopting Meteor's login result here, the userIdStore subscriber in
				// ddpSdk would notice `sdk.account.uid` is empty and dispatch a
				// SECOND `loginWithToken` on the same socket — extra ~100-200ms on
				// every page load and a divergent token in `sdk.account.user`.
				if (frame.method === 'login' && typeof frame.id === 'string') {
					ddp.onResult(frame.id, (payload) => {
						if ('error' in payload && payload.error) return;
						if (payload.result) adoptAccountFromMeteorLoginResult(payload.result);
					});
				}
				ddp.emit('send', frame);
				return;
			case 'sub':
			case 'unsub':
				// ddpSdkCollectionBridge re-feeds the matching response frames
				// (result, updated, ready, nosub, added/changed/removed) into
				// Meteor.connection._streamHandlers, where the existing
				// _methodInvokers / _subsBeingRevived bookkeeping picks them up by
				// id. We only need to put the outbound frame on the wire here.
				ddp.emit('send', frame);
				break;

			default:
			// Unknown frame type; drop quietly.
		}
	};

	// If Meteor already finished its DDP handshake before we got swapped in,
	// _lastSessionId is set and we do nothing: heartbeat is running, onConnected
	// has fired, etc. If not, synthesize a `connected` frame so Meteor moves out
	// of its initial "connecting" state. Heartbeat pings land in stub.send and
	// are answered locally with synthetic pongs.
	queueMicrotask(() => {
		const c = conn as unknown as { _lastSessionId?: string | null };
		if (c._lastSessionId) return;
		try {
			conn._streamHandlers.onMessage(
				stringifyDDP({
					msg: 'connected',
					session: 'sdk-bridged',
				} as unknown as DDPMessage),
			);
			fire('reset');
		} catch (err) {
			console.warn('[stubMeteorStream] failed to bootstrap connected state', err);
		}
	});

	// When the underlying SDK socket reconnects (e.g. after a server-side
	// ws.close / ws.terminate from force-logout in microservices), Meteor's
	// connection sees no transport event because the stub keeps reporting
	// 'connected'. Without help, both the in-flight method machinery and
	// accounts-base's reconnect-time login retry stay dormant — methods sent
	// on the prior SDK session are stranded with sentMessage=true, and the
	// per-call _reconnectStopper from callLoginMethod (accounts_client.js:292)
	// never runs. Force-logout flows then leave the user with stale
	// credentials.
	//
	// Fire `reset` on every subsequent SDK 'connected' event: this drives
	// _streamHandlers.onReset → _handleOutstandingMethodsOnReset (resends
	// pending methods so message-actions / report-message tests don't wedge)
	// AND _callOnReconnectAndSendAppropriateOutstandingMethods → DDP._reconnectHook
	// callbacks → the _reconnectStopper that retries login with the latest
	// stored token and calls makeClientLoggedOut on failure (so the
	// account-manage-devices / admin-device-management / e2ee-key-reset
	// force-logout tests recover). The first connect is handled by the
	// queueMicrotask above; skip it here. The "method result but no methods
	// outstanding" / "No callback invoker" warnings the resent blocks
	// occasionally generate are caught by the bridge's async catch in
	// ddpSdkCollectionBridge.
	const sdk = getDdpSdk();
	let firstConnectHandled = false;
	sdk.connection.on('connected', () => {
		if (!firstConnectHandled) {
			firstConnectHandled = true;
			return;
		}
		try {
			fire('reset');
		} catch (err) {
			console.warn('[stubMeteorStream] reset on SDK reconnect failed', err);
		}
	});

	// Belt-and-suspenders: when the underlying SDK socket disconnects, also reset
	// `Accounts._lastLoginTokenWhenPolled` so the next `_pollStoredLoginToken`
	// (whether triggered by the 3s polling timer or an external poke like a test's
	// `loginByUserState`) is forced to compare against `null` and fire a fresh
	// login if the stored token still exists. This covers the gap where neither
	// `useForceLogout` (stream message lost in the broker race) nor
	// `_reconnectStopper`'s `makeClientLoggedOut` ran — without this, a stored
	// token equal to the cached `_lastLoginTokenWhenPolled` short-circuits the
	// poller and the user sits with stale credentials until the next genuine
	// token rotation.
	// Belt-and-suspenders for the EE force-logout path. The existing recovery
	// mechanisms (useForceLogout via stream message; _reconnectStopper via
	// fire('reset') calling makeClientLoggedOut on auth failure) BOTH clear
	// _lastLoginTokenWhenPolled when they run, but in microservices the
	// notify-user/<uid>/force_logout stream traverses
	// rocketchat-main → broker → ddp-streamer → WS while the close fires
	// directly on ddp-streamer — so the stream message can be lost mid-flight.
	// Wire a direct sdk.connection.on('disconnected') listener that nulls
	// _lastLoginTokenWhenPolled so the next _pollStoredLoginToken call always
	// compares against null and fires a login if a token is stored.
	sdk.connection.on('disconnected', () => {
		try {
			(Accounts as unknown as { _lastLoginTokenWhenPolled?: string | null })._lastLoginTokenWhenPolled = null;
		} catch {
			// ignore — we just want the poller to wake up next time
		}
	});
}
