import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { adoptAccountFromMeteorLoginResult, getDdpSdk } from '../../lib/sdk/ddpSdk';

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

type MeteorIDDPStream = {
	currentStatus: {
		status: string;
		connected: boolean;
		retryCount: number;
		retryTime?: number;
		reason?: string;
	};
	eventCallbacks?: Record<string, Array<(...args: unknown[]) => void>>;
	statusListeners?: { changed(): void };
	on(event: string, callback: (...args: unknown[]) => void): void;
	forEachCallback(name: string, cb: (callback: (...args: unknown[]) => void) => void): void;
	send(data: string): void;
	status(): MeteorIDDPStream['currentStatus'];
	statusChanged(): void;
	reconnect(options?: unknown): void;
	disconnect(options?: { _permanent?: boolean; _error?: unknown }): void;
	_lostConnection(error?: unknown): void;
};

type MeteorConnectionInternals = {
	_stream: MeteorIDDPStream;
	_streamHandlers: {
		onMessage(raw: string): void;
		onReset(): void;
	};
};

const conn = Meteor.connection as unknown as MeteorConnectionInternals;

const realStream = conn._stream;

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

const eventCallbacks: Record<string, Array<(...args: unknown[]) => void>> = Object.create(null);
for (const [name, callbacks] of Object.entries(inheritedCallbacks)) {
	eventCallbacks[name] = (callbacks as Array<(...args: unknown[]) => void>).slice();
}
const fire = (name: string, ...args: unknown[]): void => {
	const list = eventCallbacks[name];
	if (!list) return;
	list.slice().forEach((cb) => cb(...args));
};

const TrackerDependency = (Tracker as unknown as { Dependency?: new () => { changed(): void } }).Dependency;
const statusListeners = TrackerDependency ? new TrackerDependency() : undefined;

const stub: MeteorIDDPStream = {
	currentStatus: {
		status: 'connected',
		connected: true,
		retryCount: 0,
	},

	eventCallbacks,
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
			frame = DDPCommon.parseDDP(data) as typeof frame;
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

conn._stream = stub;

const bridgePongFor = (id?: string): void => {
	conn._streamHandlers.onMessage(
		DDPCommon.stringifyDDP({ msg: 'pong', ...(id != null && { id }) } as unknown as Parameters<typeof DDPCommon.stringifyDDP>[0]),
	);
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
			DDPCommon.stringifyDDP({
				msg: 'connected',
				session: 'sdk-bridged',
			} as unknown as Parameters<typeof DDPCommon.stringifyDDP>[0]),
		);
		fire('reset');
	} catch (err) {
		console.warn('[stubMeteorStream] failed to bootstrap connected state', err);
	}
});
